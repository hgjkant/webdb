/*
 * The local list of the todos for updating purposes (updating the DOM, that is)
 */
var todos = { };

/*
 * do on document load: add event listeners for buttons and some initialization
 */
window.onload = function ( ) {
    addListeners( );
    init( );
};

/*
 * add the listeners for all the buttons (adding new item, updating item, sorting acions, etc.)
 * Most functions defined below are set as callback function here.
 */
function addListeners( ) {
    document.getElementById( "new-add" ).onclick = addTask;
    document.getElementById( "updateTask" ).onclick = updateTask;
    document.getElementById( "cancel" ).onclick = showTask;
    document.getElementById( "delete" ).onclick = deleteTask;
    document.getElementById( "main-sort" ).onchange = sortTask;
    document.getElementById( "main-action" ).onchange = action;
    //remove all check property
    $( ".first" ).click( function ( ) {
        $( "#selectAll" ).attr( "data-type", "uncheck" );
    } );
    //Check/Uncheck all CheckBoxes by Button
    $( "#selectAll" ).attr( "data-type", "check" );
    $( "#selectAll" ).click( function ( ) {
        if( $( "#selectAll" ).attr( "data-type" ) === "check" ) {
            $( ".first" ).prop( "checked", true );
            $( "#selectAll" ).attr( "data-type", "uncheck" );
            document.getElementById( "delete" ).style.display = "inline-block";
        } else {
            $( ".first" ).prop( "checked", false );
            $( "#selectAll" ).attr( "data-type", "check" );
            document.getElementById( "delete" ).style.display = "none";
        }
    } );
    //datepickers
    $( "#new-duedate" ).datepicker( { dateFormat: "dd-mm-yy" } );
    $( "#details-duedate" ).datepicker( { dateFormat: "dd-mm-yy" } );
}

function init( ) {
    //get all existing items on the server and show them when the page loads
    $.getJSON( '/getall', function ( res ) {
        //transform all received data into item objects..
        for( var key in res )
            resultToItem( res[key] );

        //..and then add all items to the list on the screen
        // Note that it was not possible to, for each item, transform to an item and then directly add
        //to the list. The children of an item would not yet be loaded then.
        for( var key in todos )
            addToList( todos[key] );
    } );
    //initialize some style to be able to show the list
    document.getElementById( "main-sort" ).style.display = "inline-block"
    document.getElementById( "main-action" ).style.display = "inline-block"
    document.getElementById( "mainlist" ).style.display = "block";
    document.getElementById( "selectAll" ).style.display = "inline-block";
    document.getElementById( "comment" ).style.display = "none";
}

/*
 * This keeps track of the checkboxes: if one or more are selected, the delete button is show,
 * else it is hidden
 */
$( document ).on( 'change', '#mainlist input:checkbox', function ( ) {
    if( $( 'input:checkbox:checked' ).length > 0 ) {
        document.getElementById( "delete" ).style.display = "inline-block";
        document.getElementById( "selectAll" ).style.display = "inline-block";
    }
    else
        document.getElementById( "delete" ).style.display = "none";

    showTask( );
} );

//Creating a new task and add to the tasklist.
//this is the callback for the add button
function addTask( ) {
    //check if new item has valid text and duedate and if at most 1 parent is selected
    //note that priority is not required
    if( ( document.getElementById( "new-text" ).value == "" ) )
        alert( "Please enter task name!" );
    else if( !( validatedate( document.getElementById( "new-duedate" ).value ) ) )
        alert( "Please enter a valid date!" );
    else if( $( 'input:checkbox:checked' ).length > 1 ) {
        alert( "Select at most 1 task to add a subtask to!" );
    }
    else {
        var name = document.getElementById( "new-text" ).value;
        var duedate = $( "#new-duedate" ).datepicker( { dateFormat: 'dd-mm-yy' } ).val( );
        var priority = document.getElementById( "new-priority" ).value;
        var rootId = 0;
        if( $( 'input:checkbox:checked' ).length === 1 )
            rootId = ( $( 'input:checkbox:checked' ).attr( 'id' ) ).slice( 2 );
        //append task to mainlist
        addItem( name, priority, duedate, rootId );
        document.getElementById( "new-priority" ).value = 0;
        document.getElementById( "new-text" ).value = "";
        var duedate = $( "#new-duedate" ).datepicker( { dateFormat: 'dd-mm-yy' } ).val( "" );
    }
}

/*
 * Showing the task in the comment panel
 * this is called whenever a checkbox changes
 */
function showTask( ) {
    if( !( $( 'input:checkbox:checked' ).length == 1 ) ) {
        //if not exactly one item is selected, hide the details panel and return
        document.getElementById( "comment" ).style.display = "none";
        return;
    }
    document.getElementById( "comment" ).style.display = "inline-block";
    //get the todo item id
    var id = ( $( 'input:checkbox:checked' ).attr( 'id' ) ).slice( 2 );
    //get the todo item and set the fields to edit
    var item = todos[id];
    document.getElementById( "details-text" ).value = item.getText();
    document.getElementById( "details-duedate" ).value = item.getDuedate();
    document.getElementById( "details-priority" ).value = item.getPriority();
}

/*
 * Updating the fields of a task based on input in the comment panel
 * this is called when the 'Update Task' button is clicked
 */
function updateTask( ) {
    var id = ( $( 'input:checkbox:checked' ).attr( 'id' ) ).slice( 2 );
    //check for valid input for taskname and date
    if( document.getElementById( "details-text" ).value == "" )
        alert( "Please enter a valid name for the task!" );
    else if( !( validatedate( document.getElementById( "details-duedate" ).value ) ) )
        alert( "Please enter a valid date !" );
    else {
        var newname = document.getElementById( "details-text" ).value;
        var newdate = document.getElementById( "details-duedate" ).value;
        var newp = document.getElementById( "details-priority" ).value;
        updateItem( id, newname, newp, newdate );
        // uncheck the checkbox and hide the edit panel ( via showTask() );
        $( 'input:checkbox:checked' ).attr( 'checked', false );
        showTask( );
    }
}

/*
 * Delete the selected tasks
 * This is called when the 'delete' button is clicked
 */
function deleteTask( ) {
    if( $( 'input:checkbox:checked' ).length > 0 ) {
        $( 'input:checkbox:checked' ).each( function ( index, item ) {
            var id = ( $( item ).attr( 'id' ) ).slice( 2 );
            deleteItem( id );
        } );
    }
    else
        alert( "Select at least one task to delete!" );
}

/*
 * Sorting function to sort on date or priority, ascending or descending. Note that the subitems of
 * any item are also ordered. To sort the list of all items is given. To sort the subitems these
 * function are recursively executed with the list of subitems.
 */
function sortByDateAsc( list ) {
    list.find( '> .item' ).sort( function ( a, b ) {
        var date1 = $( a ).attr( 'data-deadline' );
        date1 = date1.split( '-' );
        date1 = new Date( date1[2], date1[1] - 1, date1[0] );
        var date2 = $( b ).attr( 'data-deadline' );
        date2 = date2.split( '-' );
        date2 = new Date( date2[2], date2[1] - 1, date2[0] );
        return date1 > date2 ? 1 : -1;
    } ).appendTo( list );
    //sort sublist if it exists
    list.find( "> .item > .subitems" ).each( function ( index, item ) {
        sortByDateAsc( $( item ) );
    } );
}

function sortByDateDesc( list ) {
    list.find( '> .item' ).sort( function ( a, b ) {
        var date1 = $( a ).attr( 'data-deadline' );
        date1 = date1.split( '-' );
        date1 = new Date( date1[2], date1[1] - 1, date1[0] );
        var date2 = $( b ).attr( 'data-deadline' );
        date2 = date2.split( '-' );
        date2 = new Date( date2[2], date2[1] - 1, date2[0] );
        return date1 < date2 ? 1 : -1;
    } ).appendTo( list );
    //sort sublist if it exists
    list.find( "> .item > .subitems" ).each( function ( index, item ) {
        sortByDateDesc( $( item ) );
    } );
}

function sortByPriorityAsc( list ) {
    list.find( '> .item' ).sort( function ( a, b ) {
        return  $( a ).attr( 'data-pr' ) > ( $( b ).attr( 'data-pr' ) );
    } ).appendTo( list );
    //sort sublist if it exists
    list.find( "> .item > .subitems" ).each( function ( index, item ) {
        sortByPriorityAsc( $( item ) );
    } );
}

function sortByPriorityDesc( list ) {
    list.find( '> .item' ).sort( function ( a, b ) {
        return  $( a ).attr( 'data-pr' ) < ( $( b ).attr( 'data-pr' ) );
    } ).appendTo( list );
    //sort sublist if it exists
    list.find( "> .item > .subitems" ).each( function ( index, item ) {
        sortByPriorityDesc( $( item ) );
    } );
}

/*
 * Actions regarding the sorting actions in the sorting dropdown list ('Sort task list on:').
 * Note that sorting is completely on the client.
 * This is executed any time the value for that dropdown is changed (i.e. an sorting option is chosen)
 */
function sortTask( ) {
    var $wrapper = $( '#mainlist' );
    if( document.getElementById( "main-sort" ).value == 0 ) {
        //sort mainlist
        $wrapper.find( '.mainitem' ).sort( function ( a, b ) {
            return  $( a ).attr( 'id' ) > ( $( b ).attr( 'id' ) );
        } ).appendTo( $wrapper );
        //check if a sublist exist that needs to be sorted!
        for( var t = 1; t <= ( $( "#mainlist > div" ).length ); t++ ) {
            if( ( document.getElementById( 'sublist' + t ) ) != null ) {
                var $subwrapper = $( '#sublist' + t );
                $subwrapper.find( '.item' ).sort( function ( a, b ) {
                    return  $( a ).attr( 'id' ) > ( $( b ).attr( 'id' ) );
                } ).appendTo( $subwrapper );
            }
        }
    }
    else if( document.getElementById( "main-sort" ).value == 1 ) {//sort date asc
        sortByDateAsc( $wrapper );
    }
    else if( document.getElementById( "main-sort" ).value == 2 ) {//sort date desc
        sortByDateDesc( $wrapper );
    }
    else if( document.getElementById( "main-sort" ).value == 3 ) {//pr asc
        sortByPriorityAsc( $wrapper );
    }
    else if( document.getElementById( "main-sort" ).value == 4 ) {// prio desc
        sortByPriorityDesc( $wrapper );
    }
}

/*
 * actions regarding the selected action in the dropdownlist ('Choose action...').
 * This is executed any time the value for that dropdown is changed (i.e. an action is chosed)
 */
function action( ) {
    //check if any item is selected
    if( $( 'input:checkbox:checked' ).length > 0 ) {
        $.each( $( 'input:checkbox:checked' ), function ( index, value ) {
            var checkbox = $( value );
            var id = ( checkbox.attr( 'id' ) ).slice( 2 );
            var item = todos[id];
            //action: delete
            if( document.getElementById( "main-action" ).value === "1" ) {
                item.delete( );
                return;
            }
            //action: mark done
            else if( document.getElementById( "main-action" ).value === "2" ) {
                item.setProgress( "done" );
            }
            //action: mark undone
            else if( document.getElementById( "main-action" ).value === "3" ) {
                item.setProgress( "todo" );
            }
            //action: set priority to high
            else if( document.getElementById( "main-action" ).value === "4" ) {
                item.setPriority( 3 );
            }
            //action: set priority to medium
            else if( document.getElementById( "main-action" ).value === "5" ) {
                item.setPriority( 2 );
            }
            //action: set priority to low
            else if( document.getElementById( "main-action" ).value === "6" ) {
                item.setPriority( 1 );
            }
            //action: set priority to non
            else if( document.getElementById( "main-action" ).value === "7" ) {
                item.setPriority( 0 );
            }
            item.updateItem();
        } );
        //reset to default option
        $( '#main-action' ).val( '0' );
        showTask( );
    }
    //else tell the user to select an item
    else {
        alert( "Select one checkbox to execute action!" );
    }
}

/****************************************************************************************************
 *                                                                                                  *
 * These are the functions that help us do general stuff so we dont write the code multiple times   *
 *                                                                                                  *
 ****************************************************************************************************/

/*
 * clear the value for an input field
 */
function clearField( id ) {
    document.getElementById( id ).value = "";
}

/*
 * adds an item to the list (on the client)
 */
function addToList( i ) {
    //if the item is not a subitem (root is undefined) add to the list, else update root item
    if( i.getRootId() != 0 && i.getRootId() != undefined )
        getItemAndUpdate( i.getRootId() );
    else
        $( "#mainlist" ).append( i.getItem( ) );
}

/*
 * validate the date string with a regular expression
 */
function validatedate( str ) {
    var IsoDateRe = new RegExp( "^([0-9]{2})-([0-9]{2})-([0-9]{4})$" );
    var matches = IsoDateRe.exec( str );
    if( !matches )
        return false;
    var composedDate = new Date( matches[3], ( matches[2] - 1 ), matches[1] );
    return ( ( composedDate.getMonth( ) == ( matches[2] - 1 ) ) &&
            ( composedDate.getDate( ) == matches[1] ) && ( composedDate.getFullYear( ) == matches[3] ) );
}

/********************************************************************************
 *                                                                              *
 *      These are all the function that make a call to the server               *
 *                                                                              *
 ********************************************************************************/

/*
 * adds an item to the list (on the server) and a
 */
function addItem( text, priority, duedate, root ) {
    //create object to send
    var params = { text: text, priority: priority, duedate: duedate, root: root };
    //send data and add the returned data to the list on the screen
    //Note that getJson is not used as we need to make a POST request here
    $.post( '/add', params, function ( res ) {
        var i = resultToItem( res );
        addToList( i );
    }, "json" )
}
/*
 * adds an item to the list (on the server) and update it on the client list
 */
function updateItem( id, text, priority, duedate ) {
    //create object to send
    var params = { id: id, text: text, priority: priority, duedate: duedate };
    //send data and add the returned data to the list on the screen
    //Note that getJson is not used as we need to make a POST request here
    $.post( '/update', params, function ( res ) {
        var i = resultToItem( res );
        i.updateItem();
    }, "json" )
}

/*
 * get an item from the server and returns it
 */
function deleteItem( id ) {
    var params = { id: id };
    $.post( '/delete', params, function ( res ) {
        todos[id].delete();
    } );
}
/*
 * get an item from the server and returns it
 */
function getItem( id ) {
    $.getJSON( '/get?id=' + id, function ( res ) {
        resultToItem( res );
    } );
}
/*
 * get an item from the server and update it on the screen
 */
function getItemAndUpdate( id ) {
    $.getJSON( '/get?id=' + id, function ( res ) {
        var i = resultToItem( res );
        if( i != undefined )
            i.updateItem();
    } );
}

/*
 * Transforms the result returned by the server to an object we can use in the client
 * Note that this only transforms the result if it contains an id AND it overwrites the
 * local item with the same id
 */
function resultToItem( res ) {
    if( res.id != undefined ) {
        var i = new Item( res.text, res.id, res.priority, res.duedate, res.progress, res.rootId, res.sub );
        todos[i.getID()] = i;
        return i;
    }
    return undefined;
}