<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:xs="http://www.w3.org/2001/XMLSchema">

<!--
 References:
  http://www.w3.org/TR/xslt
  http://www.w3.org/TR/xpath
-->

<!-- Strip space from all elements in the source document -->
<xsl:strip-space elements="*"/>
<!-- We don't want an XML declaration at the top of the output -->
<xsl:output method="text" omit-xml-declaration="yes" indent="no"/>


<!-- Parameters passed via invoking process -->
<!--
 firstComplexTypeInterfaceName allows control over the name of the interface of the firstmost complexType.
 This is required as some C# exported request and response wrappers are poorly named, due to generics and arrays.
 If empty, no renaming is performed.
 -->
<xsl:param name="firstComplexTypeInterfaceName"></xsl:param>
<!--
 allParamsOptional = true allows to set all parameters as nullable typescript fields
 -->
<xsl:param name="allParamsOptional"></xsl:param>
<!--
 readonlyArrays = true emits types with ReadonlyArray<T> instead of T[]
 -->
<xsl:param name="readonlyArrays"></xsl:param>


<!-- Disable recursive processing in the absence of a successful pattern match -->
<xsl:template match="*|/">
</xsl:template>


<xsl:template match="/">
    <xsl:apply-templates select=".//xs:complexType[@name]"/>
</xsl:template>


<!-- Given a complex type (whose name doesn't start with 'ArrayOf'), returns the Typescript interface definition -->
<xsl:template match="xs:complexType[not(starts-with(@name, 'ArrayOf'))]">
    <xsl:variable name="interfaceName">
        <xsl:choose>
            <xsl:when test="position() = 1 and $firstComplexTypeInterfaceName">
                <xsl:value-of select="$firstComplexTypeInterfaceName"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="@name"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
<xsl:text>export interface </xsl:text><xsl:value-of select="$interfaceName"/><xsl:call-template name="maybeExtends"/><xsl:text> {
</xsl:text>
    <xsl:for-each select=".//xs:element">
        <xsl:text>    </xsl:text>
        <xsl:value-of select="@name"/>
        <xsl:choose><xsl:when test="$allParamsOptional = 'true'"><xsl:text>?</xsl:text></xsl:when></xsl:choose>
        <xsl:text>: </xsl:text>
        <xsl:call-template name="cleanType"><xsl:with-param name="rawType" select="@type"/></xsl:call-template>
        <xsl:choose><xsl:when test="$allParamsOptional = 'true'"><xsl:text> | null</xsl:text></xsl:when></xsl:choose>
        <xsl:text>;
</xsl:text>
    </xsl:for-each>
<xsl:text>}

</xsl:text>
</xsl:template>

<!--
 Given a string 'abc:ArrayOfXYZ', returns the string 'XYZ[]'.
 Given a string 'abc:XYZ', returns the string 'XYZ'.
 Otherwise, returns the given string.
-->
<xsl:template name="cleanType">
    <xsl:param name="rawType"/>
    <xsl:choose>
        <xsl:when test="starts-with(substring-after($rawType, ':'), 'ArrayOf')">
            <xsl:variable name="type">
                <xsl:call-template name="jsType"><xsl:with-param name="cleanType" select="substring-after($rawType, ':ArrayOf')"/></xsl:call-template>
            </xsl:variable>
            <xsl:call-template name="arrayType"><xsl:with-param name="elementType" select="$type"/></xsl:call-template>
        </xsl:when>
        <xsl:when test="contains($rawType, ':')">
            <xsl:call-template name="jsType"><xsl:with-param name="cleanType" select="substring-after($rawType, ':')"/></xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="$rawType"/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>


<!-- Given a type, returns an array of the type (as T[] or ReadonlyArray<T>) -->
<xsl:template name="arrayType">
    <xsl:param name="elementType"/>
    <xsl:choose>
        <xsl:when test="$readonlyArrays = 'true'">
            <xsl:text>ReadonlyArray&lt;</xsl:text><xsl:value-of select="$elementType"/><xsl:text>&gt;</xsl:text>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="$elementType"/><xsl:text>[]</xsl:text>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>


<xsl:template name="jsType">
    <xsl:param name="cleanType"/>
    <xsl:choose>
        <xsl:when test="$cleanType = 'decimal'">
            <xsl:text>number</xsl:text>
        </xsl:when>
        <xsl:when test="$cleanType = 'float'">
            <xsl:text>number</xsl:text>
        </xsl:when>
        <xsl:when test="$cleanType = 'double'">
            <xsl:text>number</xsl:text>
        </xsl:when>
        <xsl:when test="$cleanType = 'int'">
            <xsl:text>number</xsl:text>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="$cleanType"/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>


<!--
 Determines if the current node (assumed to be a complexType) has a descendent that is an extension,
 and if so, returns an ' extends X' string, otherwise just returns an empty string.
-->
<xsl:template name="maybeExtends">
    <xsl:if test=".//xs:extension">
        <xsl:text> extends </xsl:text><xsl:call-template name="cleanType"><xsl:with-param name="rawType" select=".//xs:extension/@base"/></xsl:call-template>
    </xsl:if>
</xsl:template>

</xsl:stylesheet>
