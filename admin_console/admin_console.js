var customer;

var temp_db_id;

document.addEventListener("DOMContentLoaded", function (event) {
    refreshDatabases();
});

function addDatabase(database) {
    var newTemplate = document.getElementById('database_template').cloneNode(true);
    newTemplate.setAttribute('id', undefined);
    newTemplate.getElementsByClassName("database_name")[0].innerText = database._id;

    //go to db console page!
    /*newTemplate.getElementsByClassName("database_name")[0].onclick = function () {
     window.location.href = window.location.origin + '/console/' + database._id;
     };*/

    if (database.type.includes('SHARED_STANDALONE')) {
        newTemplate.getElementsByClassName("database_type")[0].innerText = 'SHARED';
    } else if (database.type.includes('REPLICA')) {
        newTemplate.getElementsByClassName("database_type")[0].innerText = 'REPLICA';
    } else {
        newTemplate.getElementsByClassName("database_type")[0].innerText = 'STANDALONE';
    }

    /*newTemplate.getElementsByClassName("database_delete")[0].onclick = function () {
     //open confirm dialog
     document.getElementById('deletemodal').style.display = 'inline-block';
     temp_db_id = database._id;
     };*/

    /*newTemplate.getElementsByClassName("database_upgrade")[0].onclick = function () {
     window.location.href = window.location.origin + '/upgrade/' + database._id;
     };*/

    if (database.previous_stat) {
        console.log('PS: ' + database.previous_stat.disk_used_bytes);
        newTemplate.getElementsByClassName("database_disk")[0].innerText = (database.previous_stat.disk_used_bytes / 1000000).toFixed(2);
    }

    newTemplate.style.display = '';
    document.getElementById('databases').appendChild(newTemplate); //add node to bottom

}

function getMeta(property) {
    var metas = document.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("property") == property) {
            return metas[i].getAttribute("content");
        }
    }
    return null;
}

function refreshDatabases() {
    document.getElementById('databases').innerHTML = '';

    getDatabases(function (err, databases) {
        if (err) {
            console.error(err);
            return;
        }

        databases.sort(function (db0, db1) {
            if (!db0.previous_stat || !db1.previous_stat)return 0;
            if (db0.previous_stat.disk_used_bytes < db1.previous_stat.disk_used_bytes) return 1;
            if (db0.previous_stat.disk_used_bytes > db1.previous_stat.disk_used_bytes) return -1;
            return 0;
        });

        databases.forEach(function (database) {
            addDatabase(database);
        });
    })

}

function getDatabases(callback) {
    $.ajax({
        url: '/internal/dbs?api_key=oiqmf08m932m48f82n34gmlgslamg',
        type: 'GET',
        success: function (databases, textStatus, jqXHR) {
            callback(undefined, databases)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(jqXHR);
        }
    });
}


function deleteDatabase(db_id, callback) {
    $.ajax({
        url: '/api/db/' + db_id,
        type: 'DELETE',
        success: function (database, textStatus, jqXHR) {
            callback(undefined)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(jqXHR);
        }
    });
}

function getCustomer(callback) {
    $.ajax({
        type: "GET",
        url: '/internal/customer',
        success: function (customer) {
            console.log(customer);
            //check status code
            // var a = JSON.parse(data);
            callback(undefined, customer);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            callback(jqXHR);
        }
    });
}

function showError(text) {
    document.getElementById('errormodal').style.display = 'inline-block';

    try {
        document.getElementById('error_message').innerText = JSON.stringify(text, undefined, 2);
    } catch (e) {
        console.error(e);
        document.getElementById('error_message').innerText = text;
    }
}