// 더블탭, 이중탭 화면 확대 방지
document.documentElement.addEventListener('touchstart', function (event) { if (event.touches.length > 1) { event.preventDefault(); } }, false)
var lastTouchEnd = 0
document.documentElement.addEventListener('touchend', function (event) { var now = (new Date()).getTime(); if (now - lastTouchEnd <= 300) { event.preventDefault(); } lastTouchEnd = now; }, false)

// 처음에 modal 켜기
$("#NoticeModal").modal()

// 현재 날짜 계산 
var day = new Date()
var mon = day.getMonth()+1
var dt = day.getDate()

// 울산 좌표를 중심으로 map 생성 (각 지역의 중심 좌표를 입력하세요)
var defaultx = 35.54469
var defaulty = 129.31195
var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(defaultx, defaulty), // 지도의 중심좌표
        level: 8 // 지도의 확대 레벨
    }
var map = new kakao.maps.Map(mapContainer, mapOption) // 지도를 생성합니다

map.setDraggable(true)
map.setZoomable(true)
map.setMaxLevel(9)

// =============== GPS CONTROL =======================

var gps_use = null // gps 승인 여부
var gps_lat = null // 위도
var gps_lng = null // 경도
var gps_position

gps_check() // 접속하자마자 gps 반환 여부와 위도와 경도를 반환

function showLocation(position) { // gps를 반환할 수 있다면
    gps_use = true
    gps_lat = position.coords.latitude
    gps_lng = position.coords.longitude
}

function errorHandler(error) { // gps를 반환할 수 없다면
    if(error.code == 1) {
        alert("접근차단. 크롬 브라우저 사용을 권장합니다.")
    } else if( err.code == 2) {
        alert("위치를 반환할 수 없습니다.")
    }
    gps_use = false
}

function gps_check(){
    if (navigator.geolocation) {
        var options = {timeout:60000}
        navigator.geolocation.getCurrentPosition(showLocation, errorHandler, options)
    } else {
        alert("GPS_추적이 불가합니다.")
        gps_use = false
    }
}

// 마커클릭 시 화면 확대 필요 시 호출하는 함수
function zoomIn() {        
    var level = map.getLevel()
    if (level > 4){
        map.setLevel(4)
    }
}   

// 마커를 클릭했을 때 해당 장소의 상세정보를 보여줄 커스텀오버레이입니다
var placeOverlay = new kakao.maps.CustomOverlay({zIndex:1}), 
    contentNode = document.createElement('div'), // 커스텀 오버레이의 컨텐츠 엘리먼트 입니다 
    markers = [], // 마커를 담을 배열입니다
    currCategory = '', // 현재 선택된 카테고리를 가지고 있을 변수입니다
    addressResult = []

var ps = new kakao.maps.services.Places(map)

// 지도에 idle 이벤트를 등록합니다
kakao.maps.event.addListener(map, 'idle', searchPlaces)

// 아무데나 클릭하게되면 overlay를 끄게 합니다.
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    placeOverlay.setMap(null)
})

// 커스텀 오버레이의 컨텐츠 노드에 css class를 추가합니다 .
contentNode.className = 'placeinfo_wrap'

// 커스텀 오버레이의 컨텐츠 노드에 mousedown, touchstart 이벤트가 발생했을때
// 지도 객체에 이벤트가 전달되지 않도록 이벤트 핸들러로 kakao.maps.event.preventMap 메소드를 등록합니다 
addEventHandle(contentNode, 'mousedown', kakao.maps.event.preventMap)
addEventHandle(contentNode, 'touchstart', kakao.maps.event.preventMap)

// 엘리먼트에 이벤트 핸들러를 등록하는 함수입니다
function addEventHandle(target, type, callback) {
    if (target.addEventListener) {
        target.addEventListener(type, callback);
    } else {
        target.attachEvent('on' + type, callback);
    }
}

// 커스텀 오버레이 컨텐츠를 설정합니다
placeOverlay.setContent(contentNode)

// 각 카테고리에 클릭 이벤트를 등록합니다
addCategoryClickEvent()

function addCategoryClickEvent() {
    var category = document.getElementById('category'),
        children = category.children

    // category의 하위 항목에 onclick 함수를 할당해줌
    for (var i=0; i<children.length-1; i++) {
        children[i].onclick = onClickCategory
    }

    // gps(나의 위치 찾기)만 따로 함수를 만들어줘서 관리
    children[children.length-1].onclick = onClickGPS
}

// 카테고리를 클릭했을 때 호출되는 함수입니다
function onClickCategory() {
    var id = this.id,
        className = this.className

    // category 하위 항목을 선택하면 palce overlay가 꺼짐
    placeOverlay.setMap(null)

    // 현재 켜져있는 상태였던 걸 한번 더 클릭한 거면 꺼주고, 꺼진 상태였으면 활성화.
    if (className === 'on') {
        currCategory = ''
        changeCategoryClass()
        removeMarker()
    } else {
        currCategory = id
        changeCategoryClass(this)
        searchPlaces()
    }
}

// 나의위치찾기 버튼을 클릭하였을 때 호출되는 함수입니다.
function onClickGPS() {
    gps_check()
    changeCategoryClass(this)
    if (gps_use) {
        map.panTo(new kakao.maps.LatLng(gps_lat,gps_lng))
        var gps_content = '<div><img class="pulse" draggable="false" unselectable="on" src="https://ssl.pstatic.net/static/maps/m/pin_rd.png" alt=""></div>';
        var currentOverlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(gps_lat,gps_lng),
            content: gps_content,
        })
        currentOverlay.setMap(map)
    } else {
        alert("접근차단하신 경우 새로고침, 아닌 경우 잠시만 기다려주세요.")
        gps_check()
    }
}

// 클릭된 카테고리에만 클릭된 스타일을 적용하는 함수입니다
function changeCategoryClass(el) {
    var category = document.getElementById('category'),
        children = category.children
    // 다른 카테고리 하위 목록들은 다 꺼주고
    for (var i=0; i<children.length; i++ ) { 
        children[i].className = ''
    }
    // 현재 선택된 카테고리만 활성화 해 줍니다.
    if (el) {
        el.className = 'on'
    } 
} 

// 키워드 검색을 요청하는 함수입니다. 목적지 검색 및 진료소 검색의 용도로 이용됩니다.
function keysearchPlaces() {
    currCategory = 'keyword'
    var keyword = document.getElementById('keyword').value;
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('키워드를 입력해주세요!')
        return false
    }
    // 장소검색 객체를 통해 키워드로 장소검색을 요청합니다
    ps.keywordSearch(keyword, placesSearchCB)
}

// 카테고리 검색을 요청하는 함수입니다
function searchPlaces() {
    if (!currCategory) { // 현재 카테고리가 없다면 반환합니다.
        return
    }
    removeMarker(); // 지도에 표시되고 있는 마커를 제거합니다
    if (currCategory == "hospital"){
        ps.keywordSearch('울산 코로나 진료소',placesSearchCB); 
    } else if (currCategory == "mask"){
        displayMask(masks)
    }
}

// 키워드 검색 시 호출되는 콜백함수입니다.
function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        if(currCategory=='keyword'){
            displayPlaces(data[0])
        }
        else {displayPlaces(data);}
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.')
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.')
        return;
    }
}

// 지도에 마커를 표출하는 함수입니다
function displayPlaces(places) {
    // 목적지 검색의 경우 최상단 검색결과 좌표로 향하며
    if (currCategory =="keyword"){
        addMarker(new kakao.maps.LatLng(places.y, places.x))
        zoomIn()
        map.panTo(new kakao.maps.LatLng(places.y, places.x))
        displayPlaceInfo(places)
    }
    // 진료소 검색의 경우 모든 좌표를 표시합니다.
    else{
        for (var i=0; i<places.length; i++) {
            // 마커를 생성하고 지도에 표시합니다
            var marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x))
            // 마커와 검색결과 항목을 클릭 했을 때 장소정보를 표출하도록 클릭 이벤트를 등록합니다
            (function(marker, place) {
                kakao.maps.event.addListener(marker, 'click', function() {
                    zoomIn()
                    map.panTo(new kakao.maps.LatLng(place.y, place.x))
                    displayPlaceInfo(place)
                })
            })(marker, places[i])
        }
    }
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, palce_type, color) {
    if(currCategory == 'mask'){
        var imageSrc = image_url + color + '/' + palce_type + "-marker.png"
        var imageSize = new kakao.maps.Size(27, 28)  // 마커 이미지의 크기
    } else if(currCategory == 'keyword'){
        var imageSrc = 'static/main/image/keyword.png'
        var imageSize = new kakao.maps.Size(27, 28)
    } else if (currCategory == "hospital"){
        var imageSrc = image_url + 'hospital-marker.png';
        var imageSize = new kakao.maps.Size(27, 28)
    } else {
        var imageSrc = '/static/main/image/patient.png'
        var imageSize = new kakao.maps.Size(27, 28)
    }

    var imgOptions =  {offset: new kakao.maps.Point(10,20)},
        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
            marker = new kakao.maps.Marker({
            position: position,
            image: markerImage
        });

    marker.setMap(map);
    if(currCategory != ''){markers.push(marker);}  // 배열에 생성된 마커를 추가합니다
    return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
function removeMarker() {
    if (currCategory != "keyword"){
        for ( var i = 0; i < markers.length; i++ ) {
            markers[i].setMap(null);
        }   
        markers = [];
    }
}

// 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
function displayPlaceInfo (place) {
    content = ''
        + '    <div class="placeinfo pb-0">'
        + '        <div class="ptitle d-flex justify-content-between align-items-center flex-wrap">'
        + '            <h1 class="m-0 text-center">' + place.place_name + '</h1>'
        + '        </div>'
        + '        <div class="w-100 p-2">'
        + '            <span class="info_content time_at">전화 번호: <strong>' + place.phone + '</strong></span>'
        + '        </div>'
        + '    </div>'
        + '    <div class="after"></div>'

    contentNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
    placeOverlay.setMap(map);
}

// ==================== 확진자 ======================================================

var patientOverlay = new kakao.maps.CustomOverlay({zIndex:1}), 
    patientNode = document.createElement('div'); // 커스텀 오버레이의 컨텐츠 엘리먼트 입니다 

// 커스텀 오버레이의 컨텐츠 노드에 css class를 추가합니다 
patientNode.className = 'placeinfo_wrap';
// 커스텀 오버레이 컨텐츠를 설정합니다
patientOverlay.setContent(patientNode); 

// 커스텀 오버레이의 컨텐츠 노드에 mousedown, touchstart 이벤트가 발생했을때
// 지도 객체에 이벤트가 전달되지 않도록 이벤트 핸들러로 kakao.maps.event.preventMap 메소드를 등록합니다 
addEventHandle(patientNode, 'mousedown', kakao.maps.event.preventMap);
addEventHandle(patientNode, 'touchstart', kakao.maps.event.preventMap);

displayPatient(paths);

// 지도에 확진자 동선을 보여줍니다.
function displayPatient(paths) {
    var length = paths.length;
    for ( var i=0; i<length; i++ ) {
        visited_date_split = paths[i]["visited_date"].split(" ")
        var nodemon = Number(visited_date_split[1].slice(0, -1))
        var nodeday = Number(visited_date_split[2].slice(0, -1))

            // 30일을 기준으로 방문시간이 지날수록 점점 옅게 보여줍니다.
            if ( nodeday+nodemon*30 > dt+mon*30-30){
                var opa = (((nodeday+nodemon*30)-(dt+mon*30)+30)/30)
                var marker = addMarker(new kakao.maps.LatLng(paths[i]["y"], paths[i]["x"]));
                marker.setOpacity(opa);
                (function(marker, y, x, num, date, loc) {
                    kakao.maps.event.addListener(marker, 'click', function() {
                        map.panTo(new kakao.maps.LatLng(y, x))
                        displayPatientInfo(y, x, num,date,loc);
                    });
                })(marker, paths[i]["y"], paths[i]["x"], paths[i]["patient"], paths[i]["visited_date"], paths[i]["place_name"]);
        }
    }
}

// 확진자 정보 커스텀오버레이를 보여줍니다.
function displayPatientInfo (y,x,num,visited_date,place_name) {
    content = ''
        + '    <div class="placeinfo pb-0">'
        + '        <div class="ptitle d-flex justify-content-between align-items-center flex-wrap">'
        + '            <h1 class="m-0 text-center"><strong>' + num + '</strong>번 확진자 동선</h1>'
        + '        </div>'
        + '        <div class="w-100 p-2">'
        + '            <span class="info_content time_at">다녀간 날짜: <strong>' + visited_date + '</strong></span>'
        + '            <span class="info_content time_at mt-1">시설 이름: <strong>' + place_name + '</strong></span>'
        + '        </div>'
        + '    </div>'
        + '    <div class="after"></div>'
    contentNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(y, x));
    placeOverlay.setMap(map);
}

// ==================== mask store ======================================================

var maskOverlay = new kakao.maps.CustomOverlay({zIndex:1}), 
    maskNode = document.createElement('div'); // 커스텀 오버레이의 컨텐츠 엘리먼트 입니다 

// 커스텀 오버레이의 컨텐츠 노드에 css class를 추가합니다 
maskNode.className = 'placeinfo_wrap';
// 커스텀 오버레이 컨텐츠를 설정합니다
maskOverlay.setContent(maskNode); 

// 커스텀 오버레이의 컨텐츠 노드에 mousedown, touchstart 이벤트가 발생했을때
// 지도 객체에 이벤트가 전달되지 않도록 이벤트 핸들러로 kakao.maps.event.preventMap 메소드를 등록합니다 
addEventHandle(maskNode, 'mousedown', kakao.maps.event.preventMap);
addEventHandle(maskNode, 'touchstart', kakao.maps.event.preventMap);

// 마스크 API를 활용하여 지도에 공공마스크 판매처를 보여줍니다.
function displayMask(places) {
    var length = places.length;
    for ( var i=0; i<length; i++ ) {
        place_type = places[i].place_type
        if(place_type=="01"){place_type="pharmacy"}
        else if(place_type=="02"){place_type="post"}
        else if(place_type=="03"){place_type="mart"}
        else {place_type=null}

        if(places[i].remain_stat == "plenty"){ remain_stat = "100개 이상"; color="green"}
        else if(places[i].remain_stat == "some") { remain_stat = "30개 이상 100개미만"; color="yellow"}
        else if(places[i].remain_stat == "few") { remain_stat = "2개 이상 30개 미만"; color="red" }
        else if(places[i].remain_stat == "empty") { remain_stat = "1개 이하"; color="gray" }
        else if(places[i].remain_stat == "break") { remain_stat = "판매 중지"; color="gray" }
        else { remain_stat = "알 수 없음"; color="gray" }

        var marker = addMarker(new kakao.maps.LatLng(places[i].latitude, places[i].longitude), place_type, color);
        (function(marker, name, latitude, longitude, addr, updated_at, remain_stat, stock_at, place_type) {
            kakao.maps.event.addListener(marker, 'click', function() {
                displayMaskInfo(marker, name, latitude, longitude, addr, updated_at, remain_stat, stock_at, place_type);
            });
        })(marker, places[i].name, places[i].latitude, places[i].longitude, places[i].addr, places[i].updated_at, places[i].remain_stat, places[i].stock_at, places[i].place_type);
    }
}

function displayMaskInfo (marker, name, latitude, longitude, addr, updated_at, remain_stat, stock_at, place_type) {
    if(remain_stat == "plenty"){ remain_stat = "100개 이상"; color="green"}
    else if(remain_stat == "some") { remain_stat = "100개미만"; color="rgb(244,186,65)"}
    else if(remain_stat == "few") { remain_stat = "30개 미만"; color="red"}
    else if(remain_stat == "empty") { remain_stat = "1개 이하"; color="gray"}
    else if(remain_stat == "break") { remain_stat = "판매 중지"; color="gray" }
    else { remain_stat = "알 수 없음" }

    if(updated_at == "None"){updated_at = "알 수 없음"}
    else{
        noon = updated_at.slice(-3)
        updated_at = updated_at.slice(0, -3)
        day_index = updated_at.indexOf("일")
        updated_at = updated_at.slice(0, day_index+1) + noon + updated_at.slice(day_index+1)
    }
    if(stock_at == "None"){stock_at = "알 수 없음"}
    else{
        noon = stock_at.slice(-3)
        stock_at = stock_at.slice(0, -3)
        day_index = stock_at.indexOf("일")
        stock_at = stock_at.slice(0, day_index+1) + noon + stock_at.slice(day_index+1)
    }
    
    destination_url = "https://map.kakao.com/link/to/" + name + "," + latitude + "," + longitude

    content = ''
        + '    <div class="placeinfo">'
        + '        <div class="ptitle d-flex justify-content-between align-items-center flex-wrap" style="background:' + color + '">'
        + '            <h1 class="m-0">' + name + '</h1>'
        + '            <p class="m-0">' + remain_stat + '</p>'
        + '        </div>'
        + '        <div class="w-100 p-2">'
        + '            <span class="info_content time_at">갱신 시간: <strong>' + updated_at + '</strong></span>'
        + '            <span class="info_content time_at mt-1">입고 시간: <strong>' + stock_at + '</strong></span>'
        + '        </div>'
        + '        <div class="w-100 d-flex justify-content-center px-2">'
        + '            <a class="btn w-100 p-0" href="' + destination_url + '" role="button" style="letter-spacing: 2px; background-color: #DBDBDB; opacity:0.9; color: #222; height: 30px; line-height: 30px; font-weight: 700">길찾기</a>'
        + '        </div>'
        + '    </div>'
        + '    <div class="after"></div>'

    contentNode.innerHTML = content;
    var position = new kakao.maps.LatLng(latitude, longitude)
    placeOverlay.setPosition(position);
    zoomIn();
    map.panTo(new kakao.maps.LatLng(latitude, longitude));
    placeOverlay.setMap(map);
}

// 해당 장소로 길찾기를 합니다.
function searchPath(name, latitude, longitude) {
    location.href="https://map.kakao.com/link/to/" + name + "," + latitude + "," + longitude
}