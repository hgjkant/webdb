//requiring all necesasry modules
var express = require( "express" );
var url = require( "url" );
var http = require( "http" );
//creating the server on port 3000 by default, setting the folder where all static content
//should be found, and logging to the console
var app = express();
var port = process.argv[2] || 3000;
app.use( express.static( __dirname + "/public_html/" ) );
//the body parser is used to get the sent JSON object from a POST request
var bodyParser = require( 'body-parser' );
app.use( bodyParser.urlencoded() );

http.createServer( app ).listen( port );
console.log( "starting server on port " + port );

//the list with all todos and the counter to keep track of new ids
var todos = { };
var id_counter = 1;

/*
 * returns the list of all todo items
 */
app.get( "/getall", function ( req, res ) {
    res.json( todos );
} );

/*
 * adds a new item with the given parameters. The expected data here is
 * {
 *      text: 'some text',
 *      priority: 1,
 *      duedate: '01-01-2015'
 * }
 * A new item (show and the end of this file) will be returned (so with a unique id)
 */
app.post( "/add", function ( req, res ) {
    console.log( req.body.text );
    var newitem = new item( req.body.text, id_counter++, req.body.priority,
            req.body.duedate, req.body.root );
    //check if a given parent exists, else set parent to 0
    if( req.body.root != undefined && todos[req.body.root] != undefined )
        todos[req.body.root].addSub( newitem.id );
    else
        newitem.rootId = 0;
    todos[newitem.id] = newitem;
    //print and return result
    console.log( 'added: ' + newitem.id );
    console.log( newitem );
    res.json( newitem );
    res.end();
} )

/*
 * returns an item indicated by the id. The correct usage is '/get?id=1' to get item 1
 */
app.get( "/get", function ( req, res ) {
    var query = url.parse( req.url, true ).query;
    var id = query['id'];
    if( id == undefined )
        res.json();
    else {
        res.json( todos[id] );
    }
    res.end();
} )

/*
 * deletes an item. Nothing happend if no id is given. If the item has subitems,
 * these are deleted as well
 */
app.post( "/delete", function ( req, res ) {
    if( req.body.id != undefined ) {
        todos[req.body.id].delete();
    }
    res.end();
} )

/*
 * Update an existing todo item. The expected data format is the same as the 'add' function.
 * The new item is returned
 */
app.post( "/update", function ( req, res ) {
    console.log( req.body );
    var id = req.body.id;
    if( id == undefined )
        res.json( );
    else {
        //only update what is changed
        if( req.body.text != undefined )
            todos[id].text = req.body.text;
        if( req.body.priority != undefined )
            todos[id].priority = req.body.priority;
        if( req.body.duedate != undefined )
            todos[id].duedate = req.body.duedate;
        res.json( todos[id] );
    }
    res.end();
} )


/*
 * The server representation of the object. A lot smaller and no specific private attributes,
 * the client can not use or touch this object
 */
var item = ( function ( text, id, priority, duedate, root ) {
    this.text = text;
    this.id = id;
    this.priority = priority;
    this.duedate = duedate;
    this.progress = "todo";
    this.rootId = root;
    this.sub = [];

    /*
     * delete the item, AND clean up afterwards (thus also deleting children and/or parents)
     */
    this.delete = function () {
        //delete subchildren
        for( var index in this.sub )
            todos[this.sub[index]].delete();
        if( this.rootId != undefined && todos[this.rootId] != undefined )
            todos[this.rootId].deleteSub( this.id );
        todos[this.id] = undefined;
        console.log( 'deleted: ' + this.id );
    }
    this.addSub = function ( id ) {
        this.sub.push( id );
    }
    /*
     * !!! ONLY DELETES THE REFERENCE !!!
     * If you want to delete the item itself, call delete() on that item.
     */
    this.deleteSub = function ( id ) {
        var index = this.sub.indexOf( id );
        if( index > -1 )
            this.sub.splice( index, 1 );
    }
} );