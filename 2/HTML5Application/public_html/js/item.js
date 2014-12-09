/**
 * The itemModule contains all information on a single item: the text, date, priority, etc..
 * It also contains the functions the item needs to keep its representation up to date.
 */
var Item = ( function ( text, id, priority, duedate, progress, rootId, sub ) {

    /* 'private' members */
    var text = text;
    var id = id;
    var priority = priority;
    var duedate = duedate;
    //progress is not used in this solution
    var progress = progress;
    var rootId = rootId;
    //Note that sub is never manually set, only when data from the server is retrieved
    var sub = sub;

    //create the HTML string of the list of subitems if they exist
    var getSubItems = function () {
        var substring = '';
        if( sub.length > 0 ) {
            substring = '<div id = "sublist' + rootId + '" class="items subitems">';
            for( var index in sub )
                substring += todos[sub[index]].getItem();
            substring += '</div>';
        }
        return substring;
    }

    /* 'public' members; return accessible object */
    return {
        getID: function () {
            return id;
        },
        getRootId: function () {
            return rootId;
        },
        getText: function () {
            return text;
        },
        getPriority: function () {
            return priority;
        },
        getDuedate: function () {
            return duedate;
        },
        setDuedate: function ( date ) {
            duedate = date;
        },
        setPriority: function ( pr ) {
            priority = pr;
        },
        setText: function ( t ) {
            text = t;
        },
        //Returns the HTML
        getItem: function () {
            var string;
            //different HTML is returned if the item is a subitem (mainly for css reasons which are not included here)
            if( rootId == 0 ) {//if it is not a subitem
                string = '<div id ="item' + id + '" class="item mainitem progress-' + progress + ' rating-' + priority + '" data-deadline="'
                        + duedate + '" data-pr="' + priority + '"><input class = "first" id= "ch' + id
                        + '" type="checkbox"><label id="tasklabel' + id + '">' + text + '</label>' +
                        getSubItems()
                        + '</div>';
            }
            else {
                string = '<div id ="item' + id + '" class="item sub_item progress-' + progress + ' rating-' + priority + '" data-deadline="'
                        + duedate + '" data-pr="' + priority + '"><input id= "ch' + id
                        + '" type="checkbox"><label id="tasklabel' + id + '">' + text + '</label>' +
                        getSubItems()
                        + '</div>';
            }
            return string;
        },
        //update the item (get the item from the DOM and replace it with the updated HTML)
        updateItem: function () {
            var newItem = this.getItem();
            $( '#item' + id ).replaceWith( newItem );
        },
        addSub: function ( item ) {
            sub[sub.length] = item;
            item.setRoot( id );
        },
        //deletes the item from the list of todos and from the DOM
        delete: function ( ) {
            var div = document.getElementById( "item" + id );
            for( var index in sub )
                todos[sub[index]].delete();
            div.parentNode.removeChild( div );
        },
        //not used
        setProgress: function ( pr ) {
            progress = pr;
        }
    };
} );