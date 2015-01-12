Nuke.prototype.map.modules.google = function (base, index) {
    "use strict";
    var self = this,
        name = index,
        methods = {},
        map = {},
        center = {},
        markers = [],
        latlngbounds = {},
        bombRadiuses = [],
        infoWindows = [],
        lines = [],
        googleOptions = {
            satellite : google.maps.MapTypeId.SATELLITE,
            road : google.maps.MapTypeId.ROADMAP
        };

    this.init = function () {
        $('<div>').attr('id', name).addClass('map-module').hide().appendTo(base.getOption('mapArea'));

        map = new google.maps.Map(
            $('#' + name).get(0), {
                center: new google.maps.LatLng(base.getOption('lat'), base.getOption('lon')),
                zoom: base.getOption('zoom'),
                mapTypeId: googleOptions[base.getOption('mapType')]
            }
        );
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push($('#controls').get(0));
    };

    this.refresh = function () {
        map.setOptions({
            center: new google.maps.LatLng(base.getOption('lat'), base.getOption('lon')),
            zoom: base.getOption('zoom'),
            mapTypeId: googleOptions[base.getOption('mapType')]
        });
        return this;
    };

    this.show = function () {
        $('#' + name).show();
        return this;
    };

    this.hide = function () {
        $('#' + name).hide();
        return this;
    };

    this.setCenter = function (lat, lon) {
        map.setCenter(new google.maps.LatLng(lat, lon));
        return this;
    };

    this.clearMap = function () {
        var toClear = [].concat(markers, bombRadiuses, lines, infoWindows);
        latlngbounds =  new google.maps.LatLngBounds();
        map.fitBounds(latlngbounds);
        $.each(toClear, function (key, val) {
            val.setMap(null);
        });
        markers = [];
        bombRadiuses = [];
        lines = [];
        return this;
    };

    this.addMarker = function (lat, lon, draggable, listener) {
        var marker = new google.maps.Marker({
                map: map,
                draggable: draggable || false,
                position: new google.maps.LatLng(lat, lon)
            });

        if(typeof listener === 'function') {
            google.maps.event.addDomListener(marker, 'dragend', listener);
        }

        markers.push(marker);
        methods.fitBound(lat, lon);
        return this;
    };

    this.drawRadius = function (color, points) {
        var paths = [];
        $.each(points, function (key, val) {
            paths.push(new google.maps.LatLng(val[0], val[1]));
        });
        methods.fitBounds(paths);
        bombRadiuses.push(
            new google.maps.Polygon({
                strokeColor: color,
                strokeOpacity: 0.5,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: 0.38,
                map: map,
                paths: paths,
                geodesic: true
            })
        );
        return this;
    };

    this.drawLine = function (fromLat, fromLon, toLat, toLon) {
        lines.push(
            new google.maps.Polyline({
                path: [
                    new google.maps.LatLng(fromLat, fromLon),
                    new google.maps.LatLng(toLat, toLon)
                ],
                strokeColor: "#000",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map
            })
        );
        methods.fitBound(fromLat, fromLon).fitBound(toLat, toLon);
        return this;
    };

    this.numberOfRadiusContainPoint = function (lat, lon) {
        var i,
        point = new google.maps.LatLng(lat, lon),
        numberOfRadius = 0;
        for(i = 0; i < bombRadiuses.length; i++) {
            if(google.maps.geometry.poly.containsLocation(point, bombRadiuses[i])) {
                numberOfRadius += 1;
            }
        }
        return numberOfRadius;
    };

    this.addInfoWindow = function (lat, lon, message) {
        var infoWindow = new google.maps.InfoWindow({
                content: message,
                position: new google.maps.LatLng(lat, lon),
                pixelOffset: new google.maps.Size(-1, -25),
                maxWidth: 300
        });
        infoWindow.open(map);
        infoWindows.push(infoWindow);
    };

    methods.fitBounds = function (points) {
        $.each(points, function (key, val) {
            latlngbounds.extend(val);
        });
        map.fitBounds(latlngbounds);
        return this;
    };

    methods.fitBound = function (lat, lon) {
        latlngbounds.extend(new google.maps.LatLng(lat, lon));
        map.fitBounds(latlngbounds);
        return this;
    };
};
