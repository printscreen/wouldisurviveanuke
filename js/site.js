var NukeSite = {
    nuke: {},
    geocoder: {},
    init : function () {
        this.window();
        this.nuke = new Nuke({
            map: 'google',
            mapType: 'road'
        });
        this.geocoder = geocoder = new google.maps.Geocoder();
        this.listeners();
        if (typeof window.navigator.geolocation === 'undefined') {
            $('#usemylocation').hide();
        }
    },
    dropFromGeolocation : function (position) {
        NukeSite.geocode({
            'latLng' : new google.maps.LatLng(position.coords.latitude,position.coords.longitude)
        }, function (value) {
            $('#location').val(value[0].label.length > 0 ? value[0].label : '');
        });
        NukeSite.dropBomb(position.coords.latitude, position.coords.longitude);
    },
    geocode : function (request, response) {
        this.geocoder.geocode(request, function(results, status) {
            response($.map(results, function(item) {
                return {
                    label:  item.formatted_address,
                    value: item.formatted_address,
                    latitude: item.geometry.location.lat(),
                    longitude: item.geometry.location.lng()
                };
            }));
       });
    },
    getBombSize : function () {
        return $('#bombsize').val();
    },
    getPopulation : function () {
        return $('#population').val();
    },
    getCities : function () {
        return $('#cities').val();
    },
    dropBomb : function (lat, lon) {
        var message;
        $('input[name="lat"]').val(lat);
        $('input[name="lon"]').val(lon);

        this.nuke.dropBomb(
            lat,
            lon,
            this.getBombSize(),
            this.getPopulation(),
            this.getCities(),
            function() {
                return '<b>Result:</b>&nbsp;<u>' + $('#damages .'+this.getDamage()).attr('damage-class') + '</u><br />' +
                $($('#damages .'+this.getDamage()+' li')[
                    Math.floor((Math.random() * 100) % $('#damages .'+this.getDamage()+' li').length)
                ]).html();
            }
        );

        if ($('.navbar .btn-navbar').is(':visible')) {
            $('a[data-toggle="collapse"]').click();

        }
    },
    listeners : function () {
        $('#usemylocation').click(function(){
            navigator.geolocation.getCurrentPosition(NukeSite.dropFromGeolocation);
        });
        $("#location").autocomplete({
            source: function(request, response) {
                return NukeSite.geocode({'address':request.term}, response);
            },
            select: function (event, ui) {
                NukeSite.dropBomb(
                    ui.item.latitude,
                    ui.item.longitude
                );
            }
        });
        $('select').change(function () {
            if($('input[name="lat"]').val() && $('input[name="lon"]').val()) {
                NukeSite.dropBomb(
                    $('input[name="lat"]').val(),
                    $('input[name="lon"]').val()
                );
            }
        });
    },
    window : function () {
        //Please divert your eyes from this awful hack
        var map = $('#map');
        if($(window).width() > 980) {
            $('#mobile-ad').css('display','none');
            $('#square-ad').css('display','inline')
                    .css('left',$('#map').width() + (($(window).width() - $('#map').width()) / 2) - 255);
            $('#long-ad').css('display','inline')
                    .css('left', (($(window).width() - $('#map').width()) /2) + 70).css('top', $(window).height() - 70);
            map.removeClass('container')
               .height(
                    $(window).height() - $('.navbar-inner').height()
                )
               .css('padding-top','41px');
        } else {
            $('#mobile-ad').css('display','inline')
            .css('left', parseInt($(window).width()/2) - 160);
            map.addClass('container')
               .height(
                    $(window).height() - $('.navbar-inner').height() - 70
                )
               .css('padding-top','50px');
            $('a[data-toggle="collapse"]').click();
        }

    }
};

$(document).ready(function () {
    NukeSite.init();
});
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-26824767-1']);
_gaq.push(['_trackPageview']);
(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();