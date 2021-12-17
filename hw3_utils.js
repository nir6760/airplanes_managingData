export function initAll() {
    let csv_file;
    const submit_btn = document.getElementById('submit_file');
    const input_file = document.getElementById('uploaded_csv');
    const input_sec = document.getElementById('ïnput_sec');
    const tbl_view = document.getElementById('tbl_view');
    const form_p = document.getElementById('demo');
    const clear_btn = document.getElementById('clear_file');
    const download_btn = document.getElementById('download_file');
    let current_coord = undefined;
    let selected_row = undefined;
    let last_red_marker_latlng = "";

    //map
    const map_view = document.getElementById('mapid');

    //Define variables for input elements
    var fieldEl = document.getElementById("sort-field");
    var dirEl = document.getElementById("sort-direction");
    const sort_div = document.getElementById("sort_div");

    //card

    const card_div = document.getElementById('card_div');
    const info_el = document.getElementById('info_code');
    const name_info = document.getElementById('name_info');
    const id_info = document.getElementById('id_info');
    const neighborhood_info = document.getElementById('neighborhood_info');
    const room_type_info = document.getElementById('room_type_info');
    const price_info = document.getElementById('price_info');

    function insert_into_card(name_str, id_str, neighborhood_str, room_type_str, price_str) {
        name_info.innerHTML = "Name: " + name_str;
        id_info.innerHTML = "ID: " + id_str;
        neighborhood_info.innerHTML = "Neighborhood: " + neighborhood_str;
        room_type_info.innerHTML = "Room Type: " + room_type_str;
        price_info.innerHTML = "Price: " + price_str;
    }

    //table fot tabulator
    let tbl = new Tabulator(tbl_view, {
        index: "id",
        selectable: 1,
        height: 350,
        layout: "fitData",
        pagination: "local",
        placeholder: "No Data Available",
        paginationSize: 10,
        columns: [
            {title: "Name", field: "name", headerFilter: "input"},
            {title: "Host ID", field: "host_id", width: 140},
            {title: "ID", field: "id", width: 140},
            {title: "Neighborhood", field: "neighbourhood", width: 140},
            {title: "Room Type", field: "room_type", width: 140},
            {title: "Price", field: "price", width: 140},
        ],
    });

    //map for mapbox
    var mymap = L.map('mapid');

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibmlyNjc2MCIsImEiOiJja3g5Y3V4aWEwM2xqMm9wMDZobXR5Z2Q4In0.ZW7Z6URwX5LQADx8mRiCNQ'
    }).addTo(mymap);
    var markers_layer = L.layerGroup();
    let markers = {}
    var redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    function zoomTo(lat, lng) {
        //mymap.setZoom(20);
        //mymap.panTo(new L.LatLng(lat, lng));
        mymap.flyTo(new L.LatLng(lat, lng), 16, {noMoveStart: true});
    }


    //Trigger sort when "Trigger Sort" button is clicked
    document.getElementById("sort-trigger").addEventListener("click", function () {
        tbl.setSort(fieldEl.options[fieldEl.selectedIndex].value, dirEl.options[dirEl.selectedIndex].value);
    });

    function addListeners() {

        input_file.addEventListener("change", function (e) {

            csv_file = this.files[0];
            if (this.files.length !== 1
                ||
                (!csv_file.type.match('application/vnd.ms-excel')
                    && !csv_file.type.match('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                    && !csv_file.type.match('csv'))
            ) {
                input_file.value = "";
                csv_file = null;
                return;
            }


            form_p.innerHTML = this.files.length + " file(s) selected";


            submit_btn.style.visibility = "visible";


        });

        submit_btn.addEventListener("click", function (e) {
            input_sec.style.visibility = "hidden";
            submit_btn.style.visibility = "hidden";


            sort_div.style.visibility = "visible";
            clear_btn.style.visibility = "visible";
            download_btn.style.visibility = "visible";
            map_view.style.visibility = "visible";
            info_el.style.visibility = "visible";
            handle_csv();
        });

        clear_btn.addEventListener("click", function (e) {

            info_el.innerHTML = "";
            tbl.clearData();
            input_file.value = "";
            csv_file = null;
            tbl_view.style.visibility = "hidden";

            info_el.style.visibility = "hidden";
            clear_btn.style.visibility = "hidden";
            download_btn.style.visibility = "hidden";
            input_sec.style.visibility = "visible";
            submit_btn.style.visibility = "hidden";
            form_p.innerHTML = "Drag your files here or click in this area.";

            sort_div.style.visibility = "hidden";
            map_view.style.visibility = "hidden";
            input_sec.style.display = "block"
            card_div.style.visibility = "hidden";
            last_red_marker_latlng="";


        });

        //trigger download of data.csv file
        download_btn.addEventListener("click", function () {
            tbl.download("csv", csv_file.name);
        });


    }


    function papaParse() {
        Papa.parse(csv_file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results, csv_file) {
                tbl.setData(results.data)
                //table functions
                function _onSelect(row) {
                    card_div.style.visibility = "visible";
                    tbl.selectRow(parseInt(row.getData()['id']))
                    tbl.scrollToRow(row.getIndex(), "center", true);
                    try {
                        zoomTo(row.getData().latitude, row.getData().longitude);
                    } catch (error) {
                        console.error(error.toString());

                    }
                    _checkValidationlatlng(row);


                    info_el.innerHTML = JSON.stringify(row.getData(), undefined, '\t')//.substring(1,strung.length-1);


                }

                function _checkValidationlatlng(row) {
                    try {
                        let latlng = L.latLng(row.getData().latitude, row.getData().longitude);
                        _setMarkerColor(latlng);
                    } catch (error) {
                        if (last_red_marker_latlng !== "") {
                            markers[last_red_marker_latlng].marker.setIcon(L.Icon.Default.prototype);
                            last_red_marker_latlng = "";
                        }
                        console.error(error.toString());
                    }

                }


                function _onDeselect(row) {

                    _checkValidationlatlng(row);

                    info_el.innerHTML = "";
                }

                tbl.on("rowSelected", _onSelect)
                tbl.on("rowDeselected", _onDeselect)
                tbl.on("dataFiltered", function(filters, rows){
                    last_red_marker_latlng = "";
                    put_markers(rows, mymap);

                });

                // map functions
                function _moveMapCursor(event) {
                    if (last_red_marker_latlng !== "") {
                        markers[last_red_marker_latlng].marker.setIcon(L.Icon.Default.prototype);
                        last_red_marker_latlng = "";
                    }
                    var selectedData = tbl.getSelectedRows();
                    if (selectedData.length > 0) {
                        tbl.deselectRow();
                        _onDeselect(selectedData[0]);
                    }
                }
                function _setMarkerColor(latlng){
                    if (last_red_marker_latlng !== "" && last_red_marker_latlng !== latlng.toString()) {
                        markers[last_red_marker_latlng].marker.setIcon(L.Icon.Default.prototype);
                        last_red_marker_latlng = "";
                    }
                    markers[latlng.toString()].marker.setIcon(redIcon);
                    last_red_marker_latlng = latlng.toString();
                }

                function _onMarkerClick(event) {
                    var latlng = event.latlng.toString();
                    _moveMapCursor(event);
                    _setMarkerColor(latlng);
                    var row_id = markers[event.latlng.toString()].row["id"];
                    if(selected_row !== tbl.getRow(row_id)){
                        tbl.setPage(parseInt(tbl.getRow(row_id).getPosition(true)/10+1));
                        tbl.selectRow(parseInt(row_id));
                    }


                }

                function put_markers(rows, map) {
                    markers_layer.clearLayers();
                    markers = {}
                    for (let row of rows) {
                        if (typeof row['getData'] === 'function') {
                            row = row.getData()
                        }
                        try {
                            let marker = L.marker([row.latitude, row.longitude], {title: row.name, riseOnHover: true});
                            markers_layer.addLayer(marker);
                            markers[marker._latlng.toString()] = {marker: marker, row: row};
                            marker.on('click', _onMarkerClick);
                        } catch (error) {
                            console.error(error.toString());

                        }
                    }
                    map.addLayer(markers_layer);
                }

                function _mouseDown(event) {
                    current_coord = mymap.getCenter();
                }

                function _mouseUp(event) {
                    let selected = tbl.getSelectedRows();
                    if (selected.length > 0) {
                        selected_row = selected[0];
                    } else {
                        if (last_red_marker_latlng !== "") {
                            markers[last_red_marker_latlng].marker.setIcon(L.Icon.Default.prototype);
                            last_red_marker_latlng = "";
                        }

                        selected_row = undefined
                    }
                    if (mymap.getCenter().lat !== current_coord.lat
                        ||
                        mymap.getCenter().lng !== current_coord.lng) {
                        _moveMapCursor(event)
                    }
                }

                var first_coord = ["40.74561", "-73.91927"];
                mymap.setView(first_coord, 13);
                try {
                    first_coord = [results.data[0].latitude, results.data[0].longitude];
                    mymap.setView(first_coord, 13);
                } catch (error) {
                    console.error(error.toString());

                }

                mymap.on('mousedown', _mouseDown);
                mymap.on('mouseup', _mouseUp);
                mymap.on('movestart', _moveMapCursor);

                put_markers(tbl.getData(), mymap);
            }
        });
    }

    //clear function

    function handle_csv() {
        papaParse();
        tbl_view.style.visibility = "visible";

        // handle download


    }

    addListeners();


}



