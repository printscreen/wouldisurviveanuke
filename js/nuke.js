var Nuke = function (parameters) {
    "use strict";
    this.DEFAULT_LAT = 0;// USA 37.09024;
    this.DEFAULT_LON = 0;// USA -95.712891;
    this.DEFAULT_ZOOM = 2;
    this.DEFAULT_CITIES_PATH = 'cities.json';
    this.EARTHRADIUS = 6371;
    var self = this,
        methods = {},
        cities = [],
        damage = 0,
        earthRadius = this.EARTHRADIUS,
        DAMAGETYPES = {
            NONE: 0,
            THIRDDEGREE: 1,
            SECONDDEGREE : 2,
            FIRSTDEGREE : 3,
            DEATH: 4
        },
        options = {
            map : 'google',
            mapArea : '#map',
            mapType : 'satellite',
            lat: this.DEFAULT_LAT,
            lon: this.DEFAULT_LON,
            zoom: this.DEFAULT_ZOOM,
            cities: this.DEFAULT_CITIES_PATH,
            innerInner: '#000000',
            innerOuter: '#660066',
            outerInner: '#cc6666',
            outerOuter: '#ff9933'
        };

    $.extend(options, parameters);

    methods.init = function () {
        //Initialize map
        $.each(self.map.modules, function (index, Module) {
            self.map.modules[index] = new Module(self, index);
            self.map.modules[index].init();
        });
        //Show map
        self.map.modules[options.map].show();
        $.ajax({
            url: options.cities,
            async: false,
            dataType: 'json',
            success: function (result) {
                cities = result;
            },
            error: function () {
                alert('Unable to load cities');
            }
        });
    };

    methods.distance = function (lat1, lon1, lat2, lon2) {
        var a =  Math.pow(Math.sin(methods.radians(lat2 - lat1) / 2), 2) +
                 Math.pow(Math.sin(methods.radians(lon2 - lon1) / 2), 2) *
                 Math.cos(methods.radians(lat1)) *
                 Math.cos(methods.radians(lat2));
        return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    methods.radians = function (number) {
        return number * Math.PI / 180;
    };

    methods.kmToDegX = function (kms, lat) {
        lat = Math.abs(lat);
        return (kms / (111.12 + (lat * 2.25)));
    };

    methods.kmToDegY = function (kms) {
        return (kms / 111.12);
    };

    methods.ba = function (kt, burns) {
        var A = 1, B = 1;
        if (burns === 1) {
            A = 0.38;
            B = 1.20;
        }
        if (burns === 2) {
            A = 0.40;
            B = 0.87;
        }
        if (burns === 3) {
            A = 0.34;
            B = 0.67;
        }
        if (burns === 4) {
            A = 0.30;
            B = 0.55;
        }
        return Math.pow(kt, A) * B;
    };

    methods.cX = function (x, radius, angle) {
        return x + radius * Math.cos(methods.radians(angle));
    };

    methods.cY = function (y, radius, angle) {
        return y + radius * Math.sin(methods.radians(angle));
    };

    methods.getClosestCities = function (lat, lon) {
        var tempArray = [],
            city;
        while (cities.length > 0) {
            city = cities.pop();
            city[3] = methods.distance(lat, lon, city[0], city[1]);
            methods.inserSort(tempArray, city, 0, tempArray.length - 1);
        }
        return tempArray;
    };

    methods.inserSort = function (array, item, start, end) {
        if (array.length === 0) {
            array.push(item);
        } else if (start === end) {
            if (array[start][3] > item[3]) {
                array.splice(start, 0, item);
            } else {
                array.splice(start + 1, 0, item);
            }
        } else {
            var number = Math.ceil((start + end) / 2);
            if (array[number][3] >= item[3]) {
                methods.inserSort(array, item, start, number - 1);
            } else {
                methods.inserSort(array, item, number, end);
            }
        }
    };

    methods.getRadius = function (lat, lon, bombSize) {
        var vX = 0,
            vY = 0,
            step = 64,
            zX = [],
            zY = [],
            tV = 0,
            i = 0,
            results = {
                outerOuter : [],
                outerInner : [],
                innerOuter : [],
                innerInner : []
            };

        zX[0] = methods.kmToDegX(methods.ba((bombSize), 1), lat);
        zX[1] = methods.kmToDegX(methods.ba((bombSize), 2), lat);
        zX[2] = methods.kmToDegX(methods.ba((bombSize), 3), lat);
        zX[3] = methods.kmToDegX(methods.ba((bombSize), 4), lat);

        zY[0] = methods.kmToDegY(methods.ba((bombSize), 1));
        zY[1] = methods.kmToDegY(methods.ba((bombSize), 2));
        zY[2] = methods.kmToDegY(methods.ba((bombSize), 3));
        zY[3] = methods.kmToDegY(methods.ba((bombSize), 4));

        if (zX[1] > zX[0]) {
            tV = zX[1];
            zX[1] = zX[0];
            zX[0] = tV;
        }
        if (zY[1] > zY[0]) {
            tV = zY[1];
            zY[1] = zY[0];
            zY[0] = tV;
        }
        for (i = 0; i < (step + 1); i += 1) {
            vX = methods.cX(lat, zX[3], (i * (360 / step)));
            vY = methods.cY(lon, zY[3], (i * (360 / step)));
            results.innerInner[i] = [vX, vY];
            vX = methods.cX(lat, zX[2], (i * (360 / step)));
            vY = methods.cY(lon, zY[2], (i * (360 / step)));
            results.innerOuter[i] = [vX, vY];
            vX = methods.cX(lat, zX[1], (i * (360 / step)));
            vY = methods.cY(lon, zY[1], (i * (360 / step)));
            results.outerInner[i] = [vX, vY];
            vX = methods.cX(lat, zX[0], (i * (360 / step)));
            vY = methods.cY(lon, zY[0], (i * (360 / step)));
            results.outerOuter[i] = [vX, vY];
        }
        return results;
    };

    methods.calculateDamage = function (fromLat, fromLon, toLat, toLon, radiuses) {
        var distance = methods.distance(fromLat, fromLon, toLat, toLon);
        if(distance < methods.distance(fromLat, fromLon, radiuses.innerInner[0][0],radiuses.innerInner[0][1])) {
            return DAMAGETYPES.DEATH;
        }
        if(distance < methods.distance(fromLat, fromLon, radiuses.innerOuter[0][0],radiuses.innerOuter[0][1])) {
            return DAMAGETYPES.FIRSTDEGREE;
        }
        if(distance < methods.distance(fromLat, fromLon, radiuses.outerInner[0][0],radiuses.outerInner[0][1])) {
            return DAMAGETYPES.SECONDDEGREE;
        }
        if(distance < methods.distance(fromLat, fromLon, radiuses.outerOuter[0][0],radiuses.outerOuter[0][1])) {
            return DAMAGETYPES.THIRDDEGREE;
        }
        return DAMAGETYPES.NONE;
    };

    this.getOptions = function () {
        return options;
    };

    this.getOption = function (arg) {
        return options[arg];
    };

    this.getCities = function () {
        return cities;
    };

    this.getDamage = function () {
        return damage;
    };

    this.setMessage = function (lat, lon, message) {
        self.map.modules[options.map].addInfoWindow(lat, lon, message);
        return this;
    };

    this.dropBomb = function (lat, lon, bombsize, population, numOfCities) {
        cities = methods.getClosestCities(lat, lon);
        var bombedCities = [],
            radius = [],
            damages = [],
            map = self.map.modules[options.map];
        map.clearMap().setCenter(lat, lon).addMarker(lat, lon);
        $.each(cities, function (key, val) {
            if (val[2] > population) {
                bombedCities.push(val);
                radius = methods.getRadius(val[0], val[1], bombsize);
                damages.push(methods.calculateDamage(val[0], val[1], lat, lon, radius));
                map.drawRadius(options.outerOuter, radius.outerOuter)
                    .drawRadius(options.outerInner, radius.outerInner)
                    .drawRadius(options.innerOuter, radius.innerOuter)
                    .drawRadius(options.innerInner, radius.innerInner)
                    .drawLine(lat, lon, val[0], val[1])
                    .addMarker(val[0], val[1]);
            }
            if (bombedCities.length >= numOfCities) {
                return false;
            }
        });
        damage = Math.max.apply(null, damages);
    };
    methods.init();
};
Nuke.prototype.map = {modules: {}};
