var fs = require('fs');
var Handlebars = require('handlebars');
var path = require('path');
var scrape = require('scrape-url');
var execSync = require('child_process').execSync;
var async = require('async');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

// Enable debugging to:
// + emit more info into the generated files
// + retain intermediate files
var debugging = false;
var temporaryFileIndex = 0;

var tmpPath = path.join(__dirname, '/../../.tmp');
var outputPath = __dirname + '/../../gen';

var server = 'http://services-demo.booktrack.com';

var basePaths = [
    '/account',
    '/audio',
    '/booktrack',
    '/image',
    // '/restricted/audio',
    // '/restricted/image',
    '/text',
    '/wip',
    '/marketplace',
    '/stripe',
    '/studio'
];

var requestPool = {
    // We are kind to the server and limit the number of concurrent requests.
    // This means our tool takes longer to complete.
    maxSockets: 1
};

var requestsWithOptionalParameters = [
    '/account/find-users',
    '/account/update-user-profile',
    '/account/register-booktrack-teacher',
    '/audio/find-tracks',
    '/audio/find-project-tracks',
    '/booktrack/find-booktracks',
    '/booktrack/find-education-booktracks',
    '/booktrack/find-education-managed-booktracks',
    '/image/find-images',
    '/marketplace/find-orders',
    '/studio/auto-create-audio-regions',
    '/studio/create-audio-regions-change-set',
    '/studio/create-narration-regions-change-set',
    '/studio/get-text-analysis',
    '/studio/get-track-suggestions',
    '/text/find-education-text-documents',
    '/text/find-text-documents'
];

var skip = [
    '/studio/get-project-content',
    '/studio/get-project-table-of-contents',
    '/studio/upload-cover',
    '/audio/upload-audio'
];


mkdirp.sync(tmpPath);
rimraf.sync(outputPath, { glob: false });

var templateSource = fs.readFileSync(path.join(__dirname, 'operation-template.ts.hb'), { encoding: 'utf8' });
var template = Handlebars.compile(templateSource);

module.exports = function processBasePaths(doneAll) {
    async.parallel(basePaths.map(function(basePath) {
        mkdirp.sync(outputPath + basePath);
        var operationsHelpPageUrl = server + basePath + '/help';
        return function(done) {
            processOperationsPage(basePath, operationsHelpPageUrl, done);
        };
    }), doneAll);
};


function processOperationsPage(basePath, operationsHelpPageUrl, doneAll) {
    scrape({ url: operationsHelpPageUrl, pool: requestPool }, 'a', function (error, rawOperationLinks) {
        if (error) {
            console.error("Could not scrape", operationsHelpPageUrl, error);
            return;
        }

        async.parallel(rawOperationLinks.map(function(rawOperationLink) {
            var operationHelpPageUrl = server + basePath + '/' + rawOperationLink.attr('href');
            console.log(operationHelpPageUrl);
            return function(done) {
                processOperationPage(basePath, operationHelpPageUrl, done);
            };
        }), doneAll);
    });
}


function processOperationPage(basePath, helpPageUrl, done) {
    scrape({ url: helpPageUrl, pool: requestPool }, ['.uri-template', '.method', '.request-schema', '.response-schema'], function(error, rawUriTemplates, rawMethods, rawRequestSchemas, rawResponseSchemas) {
        var operationName = helpPageUrl.substring(helpPageUrl.lastIndexOf('/') + 1);
        var uriTemplate = rawUriTemplates[0].text().substring(server.length);
        var httpMethod = rawMethods[0].text().toUpperCase();
        var requestSchemas = rawRequestSchemas.map(function(e) { return e.text(); });
        var responseSchemas = rawResponseSchemas.map(function(e) { return e.text(); });
        emitOperation(basePath, operationName, helpPageUrl, uriTemplate, httpMethod, requestSchemas, responseSchemas);
        done();
    });
}


function emitOperation(basePath, operationName, helpPageUrl, uriTemplate, httpMethod, requestSchemas, responseSchemas) {

    var relativeRoot = path.relative('.' + basePath, '.');

    var sausageCaseOperationName = toSausageCase(operationName);
    var rootPath = basePath + '/' + sausageCaseOperationName;
    if (skip.indexOf(rootPath) !== -1) {
        return;
    }
    if (httpMethod === "*") {
        return;
    }

    var requestInterfaces = requestSchemas.map(function(schema, index) {
        var firstComplexTypeInterfaceName = (index === 0 ? 'RequestBody' : '');
        var allOptional = requestsWithOptionalParameters.indexOf(rootPath) !== -1;
        // all request parameters are implied to be optional because "required" property is checked on application level, not protocol
        return generateInterfacesFromSchema(schema, firstComplexTypeInterfaceName, allOptional, true);
    });

    var responseInterfaces = responseSchemas.map(function(schema, index) {
        var firstComplexTypeInterfaceName = (index === 0 ? 'ResponseBody' : '');
        return generateInterfacesFromSchema(schema, firstComplexTypeInterfaceName, false, false);
    });

    var uriVariables = [];
    var needsLeadingQuote = true;
    var needsTrailingQuote = true;
    var uriBuilder = uriTemplate.replace(/\{(\w+)\}/g, function(wrappedUriVariable, p, offset) {
        var uriVariable = wrappedUriVariable.substring(1, wrappedUriVariable.length - 1).toLowerCase();
        uriVariables.push(uriVariable);
        return "${requestParameters." + uriVariable + "}";
    });
    uriBuilder = "`${baseUrl}" + uriBuilder + "`";

    var hasQuery = !!uriVariables.length;
    var hasBody = !!requestInterfaces.length;
    var hasResponse = !!responseInterfaces.length;

    var requestParametersInterface;
    if (hasQuery) {
        requestParametersInterface = uriVariables.map(function(uriVariable) {
            return '    ' + uriVariable + ': string | number | boolean;';
        })
        .join('\n');
        requestParametersInterface = 'export interface RequestParameters {\n' + requestParametersInterface + '\n}\n\n';
    } else {
        requestParametersInterface = '';
    }

    var interfaces = replaceAll((requestParametersInterface + requestInterfaces.join('') + responseInterfaces.join('')).trim(), "\n\n\n", "\n\n");

    var requestBodyType;
    if (hasBody) {
        requestBodyType = "json";
    } else {
        requestBodyType = "none";
    }

    var responseBodyType;
    if (hasResponse) {
        responseBodyType = "json";
    } else {
        responseBodyType = "none";
    }

    var metadataTypeVariables = [];
    if (hasQuery) {
        metadataTypeVariables.push("RequestParameters");
    } else {
        metadataTypeVariables.push("undefined");
    }
    if (hasBody) {
        metadataTypeVariables.push("RequestBody");
    } else {
        metadataTypeVariables.push("undefined");
    }
    if (hasResponse) {
        metadataTypeVariables.push("ResponseBody");
    } else {
        metadataTypeVariables.push("undefined");
    }

    var maybeRequestParametersParameter = hasQuery ? ", requestParameters: RequestParameters" : "";


    var content = template({
        relativeRoot: relativeRoot,

        operationName: operationName[0].toLowerCase() + operationName.substring(1),
        uri: uriTemplate,
        method: httpMethod,
        helpUrl: helpPageUrl,

        requestParameters: hasQuery,
        requestBodyType: requestBodyType,
        responseBodyType: responseBodyType,
        lowercaseMethod: httpMethod.toLowerCase(),
        metadataTypeVariables: `<${metadataTypeVariables.join(", ")}>`,
        maybeRequestParametersParameter: maybeRequestParametersParameter,

        uriBuilder: uriBuilder,
        interfaces: interfaces,
    });
    fs.writeFileSync(outputPath + rootPath + '.ts', content);
    if (debugging) {
        console.log(content);
    }


    function generateInterfacesFromSchema(schema, firstComplexTypeInterfaceName, allOptional, readonlyArrays) {
        // xsltproc doesn't accept stdin for the source data,
        //  we thus write out the schema to a temporary file.
        var temporaryFileName = path.join(tmpPath, 'source-' + (temporaryFileIndex++) + '.xsd');
        fs.writeFileSync(temporaryFileName, schema);
        var result = execSync('xsltproc ' +
        '--stringparam "firstComplexTypeInterfaceName" "' + firstComplexTypeInterfaceName + '" ' +
        '--stringparam "allParamsOptional" "' + allOptional + '" ' +
        '--stringparam "readonlyArrays" "' + readonlyArrays + '" ' +
        __dirname + '/xsd-to-ts-interface.xslt ' + temporaryFileName).toString('utf8');
        if (!debugging) {
            fs.unlinkSync(temporaryFileName);
        }
        if (debugging) {
            result = '\n// Generated from schema in ' + temporaryFileName + '\n' + result;
        }
        if (result.trim().length) {
            // Hmm, not so sure why this is actually needed. Something must be trimming trailing whitespace!
            result += '\n';
        }
        return result;
    }
}

// Converts a string like 'GetStudentDetails' into 'get-student-details'
// Also handles cases like 'WOWThereBeXMLHttpRequests', 'wow-there-be-xml-http-requests'
// Adapted from http://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-camel-case
function toSausageCase(t) {
    return t.replace(/(.)([A-Z][a-z]+)/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toSentenceCase(s) {
    return `${s.charAt(0).toUpperCase()}${s.substring(1).toLowerCase()}`;
}

function replaceAll(s, find, replacement) {
    var previous = s;
    while (true) {
        var next = previous.replace(find, replacement);
        if (next === previous) {
            return next;
        }
        previous = next;
    }
}
