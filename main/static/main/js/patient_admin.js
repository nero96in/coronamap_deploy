// 마커를 담을 배열입니다
var markers = [];

var defaultx = 35.54469;
var defaulty = 129.31195;
var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(defaultx, defaulty), // 지도의 중심좌표
        level: 8, // 지도의 확대 레벨
    }; 
var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 장소 검색 객체를 생성합니다
var ps = new kakao.maps.services.Places(map); 

// 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다
var infowindow = new kakao.maps.InfoWindow({zIndex:1});
var placeOverlay = new kakao.maps.CustomOverlay({zIndex:1})
var contentNode = document.createElement('div')
contentNode.className = 'placeinfo_wrap';
addEventHandle(contentNode, 'mousedown', kakao.maps.event.preventMap);
addEventHandle(contentNode, 'touchstart', kakao.maps.event.preventMap);
placeOverlay.setContent(contentNode);  

// 키워드 검색을 요청하는 함수입니다
function addEventHandle(target, type, callback) {
    if (target.addEventListener) {
        target.addEventListener(type, callback);
    } else {
        target.attachEvent('on' + type, callback);
    }
}

function keysearchPlaces() {
    var keyword = document.getElementById('keyword').value;
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('키워드를 입력해주세요!');
        return false;
    }
    // 장소검색 객체를 통해 키워드로 장소검색을 요청합니다
    ps.keywordSearch(keyword, placesSearchCB); 
}

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data[0])
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');c
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
    }
}

// 지도에 마커를 표출하는 함수입니다
function displayPlaces(places) {
    addMarker(new kakao.maps.LatLng(places.y, places.x));
    zoomIn();
    map.panTo(new kakao.maps.LatLng(places.y, places.x));
    displayPlaceInfo(places);
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, palce_type, color) {
    var imageSrc = '/static/main/image/patient.png'
    var imageSize = new kakao.maps.Size(27, 28)  // 마커 이미지의 크기
    var imgOptions =  {offset: new kakao.maps.Point(10,20)},
        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
            marker = new kakao.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    return marker;
}

function zoomIn() {        
    var level = map.getLevel();
    if (level > 4){
        map.setLevel(4);
    }
}   

// 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
function displayPlaceInfo (place) {
    $( function() {
        $( "#datepicker" ).datepicker();
    } );

    content = ''
        + '    <div class="placeinfo">'
        + '        <div class="ptitle d-flex justify-content-between align-items-center flex-wrap">'
        + '            <h1 class="m-0" id="place_name">' + place.place_name + '</h1>'
        + '        </div>'
        + '        <div class="w-100 p-2">'
        + '            <span class="info_content time_at">X: <strong id="place_X">' + place.x + '</strong></span>'
        + '            <span class="info_content time_at mt-1">Y: <strong id="place_Y">' + place.y + '</strong></span>'
        + '            <span class="info_content time_at mt-1">환자 코드: <input type="text" id="patient_code"></span>'
        + '            <span class="info_content time_at mt-1">방문 날짜: <input type="text" id="datepicker"></span>'
        + '        </div>'
        + '        <div class="w-100 d-flex justify-content-center px-2">'
        + '            <a id="PathAdd" class="btn w-100 p-0" style="letter-spacing: 2px; background-color: #DBDBDB; opacity:0.9; color: #222; height: 30px; line-height: 30px; font-weight: 700">동선으로 추가하기</a>'
        + '        </div>'
        + '    </div>'
        + '    <div class="after"></div>'
    
    contentNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
    placeOverlay.setMap(map);
    console.log(placeOverlay)

    // console.log($("#PlaceAdd"))
    $("#PathAdd").click(function() {
        var x = $("#place_X").text()
        var y = $("#place_Y").text()
        var place_name = $("#place_name").text()
        var patient_code = $("#patient_code")[0].value
        var visited_date = $("#datepicker")[0].value
        $.ajax({
            type: "POST",
            url: "/path_add",
            data: {
                'x': x,
                'y': y,
                'visited_date': visited_date,
                'place_name': place_name,
                'patient_code': patient_code,
                'csrfmiddlewaretoken': getCsrfToken(),
                'dataType': 'json',
            },
            success: function(response){
                if(response.type=="success"){
                    alert(response.message)
                } else if(response.type=="error"){
                    alert(response.message)
                }
            },
            error: function(request, status, error){
                alert("로그인이 필요합니다.")
                window.location = "/admin/login/"
            }
        })
    })
}

$(".path_delete").click(function() {
    console.log($(this))
    var pk = $(this).attr("id")
    $.ajax({
        type: "POST",
        url: "/path_delete",
        data: {
            'pk': pk,
            'csrfmiddlewaretoken': getCsrfToken(),
            'dataType': 'json',
        },
        success: function(response){
            alert("확진자 동선을 삭제하였습니다..")
        },
        error: function(request, status, error){
            alert("로그인이 필요합니다.")
        }
    })
})