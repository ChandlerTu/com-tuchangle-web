define( function() { // define 是 AMD（Asynchronous Module Definition，异步模块加载机制）的 API。

    'use strict'; // use strict 是使用严格模式，不能使用未声明的变量。

    /* Convert a single or array of resources into "URI1\nURI2\nURI3..." */
    return {
        read: function( str /*, opts */ ) { // 字符串到数组
            return str.split( '\n' );
        },
        write: function( obj /*, opts */ ) { // 数组到字符串
            // If this is an Array, extract the self URI and then join using a newline
            if ( obj instanceof Array ) {
                return obj.map( function( resource ) {
                    return resource._links.self.href;
                } ).join( '\n' );
            } else { // otherwise, just return the self URI
                return obj._links.self.href;
            }
        }
    };

} );
