# Django를 이용한 지역 코로나맵 제작 Template
[울산 코로나맵](https://coronamap-ulsan.site/) 개발진들이 **각 지역의 코로나맵 제작**을 좀 더 쉽고 빠르게 제작할 수 있도록 배포한 Django APP입니다. 아래의 가이드라인을 따라 프로젝트를 제작하여 배포하실 수 있습니다.

### 사용한 API
1. [공공 데이터 포털 공적 마스크 판매 현황 API](https://app.swaggerhub.com/apis-docs/Promptech/public-mask-info/20200307-oas3#/)
2. [Kakao map API](http://apis.map.kakao.com/)

### 개발진
- **기획/프론트 개발**: [김지완](https://kjwan4435.tistory.com/)(UNIST 인간공학과)  
- **백/프론트 개발**: [전대성](https://nerogarret.tistory.com/)(UNIST 경영공학과)  
- **디자인**: [김태윤](https://www.facebook.com/taeyoon.kim.79656)(UNIST 창의 디자인 학과)  
- 기타 문의: coronaulsan@gmail.com
---
# 기능 설명
#### 모바일과 데스크탑 화면 모두 호환되어있는 깔끔한 UI의 지역 단위 코로나맵입니다. 세부 기능은 아래와 같습니다.

1. 지역 내 공적 마스크 판매처와 현황을 마커로 표시해 줍니다.
<이미지 추가>
2. 30일 내에 확진자가 다녀간 동선을 주황색 마커로 표시해 줍니다. 다녀간 지 오래될 수록 색이 옅어집니다.
<이미지 추가>
3. 공적 마스크 판매처와 현황, 확진자 정보, 확진자 동선 정보 등을 주기적으로 **자동 업데이트**하고 확진자 동선이 업데이트될 시 **메일**로 수신 가능합니다.
4. 지역 내 선별 진료소를 표시해줍니다.
<이미지 추가>
5. 확진자 동선을 GUI로 쉽고 빠르게 추가할 수 있습니다.
<이미지 추가>
---
# 배포 가이드 라인

## 초기 설정
#### - 다운로드 및 패키지 설치
1. `git clone https://github.com/nero96in/coronamap_deploy.git` 로 다운로드
2. 가상환경 생성 및 활성화 후, `pip3 install -r requirements.txt`로 필요한 패키지 설치

#### - 프로젝트 생성 및 settings.py 설정
1. `django-admin startproject <프로젝트 명>` 으로 Django 프로젝트 생성
2. `manage.py`가 있는 폴더에 `main`폴더를 붙여넣기
3. `<프로젝트 명>/settings.py` 수정
    1. `ALLOWED_HOSTS`에 배포시 사용할 도메인 추가
    2. `INSTALLED_APP`에 `main` 추가
    3. `LANGUAGE_CODE`을 `ko-kr`로 수정
    4. `TIME_ZONE`을 `Asia/Seoul`로 수정
    5. `settings.py` 가장 하단에 아래 코드를 추가
  ~~~
  STATIC_URL = '/static/'
  STATIC_ROOT = os.path.join(BASE_DIR, 'static')

  # 배포시 10분에 한번씩 아래의 함수를 실행하여 데이터베이스를 자동으로 업데이트 합니다.
  # 데이터베이스에 환자 동선 정보가 업데이트 되었을 경우 아래에 설정한 이메일로 경보 알람이 갑니다.
  CRONJOBS = [
      ('*/10 * * * *', 'main.views.get_mask_stores', '>> /home/ubuntu/mask_stores.log'),
      ('*/10 * * * *', 'main.views.get_status', '>> /home/ubuntu/statistics.log'),
      ('*/10 * * * *', 'main.views.get_patients', '>> /home/ubuntu/patients_crawl.log'),
  ]

  # 경보 메일을 받기 위한 이메일 설정입니다.
  # 사용할 이메일의 SMTP 서버 사용을 허용하고 추가하셔야 합니다. 아래 링크는 Gmail 사용 기준 SMTP 서버 사용 가이드입니다.
  # https://velog.io/@ground4ekd/django-send-mail#gmail-smtp-%EC%84%9C%EB%B2%84
  EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
  EMAIL_HOST = "smtp.gmail.com"
  EMAIL_HOST_USER = '경보 메일을 받을 이메일 입력'
  EMAIL_HOST_PASSWORD = '이메일 비밀번호 입력'
  EMAIL_PORT = 587
  EMAIL_USE_TLS = True
  DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
  ~~~
4. `<프로젝트 명>/urls.py`를 아래 코드로 **대체**
~~~
from django.contrib import admin
from django.urls import path
from main import views as main_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', main_views.main, name="main"),
    path('patient_admin', main_views.patient_admin, name="patient_admin"), # 서버명/patient_admin 주소에서 확진자 동선 추가 혹은 삭제 가능.
    path('path_add', main_views.path_add, name="path_add"),
    path('path_delete', main_views.path_delete, name="path_delete"),
]
~~~
5. Model Migration
    1. `python3 manage.py makemigrations && python3 manage.py migrate`
    2. `python3 manage.py createsuperuser` 로 관리자 계정 생성
    
  
## Kakaomap API 설정 관련
1. `main/static/main/js/corona.js`와 `main/static/main/js/patient_admin.js` 파일에서 `defaultx`와 `defaulty` 변수를 자신의 **지역의 중심좌표**로 수정
2. `main/static/main/js/corona.js`의 `searchPlace` 함수 내에 진료소 검색을 위한 키워드(`울산 코로나 진료소`로 되어 있는 부분)를 수정
3. `main/templates/main/index.html`와  `main/templates/main/patient_admin.html`의 head 태그에 `{API키를 입력하세요}` 부분에 자신의 kakaomap API key를 입력

  
## 확진자 정보 및 동선 정보 크롤링 관련 (`main/views.py`)
`main/views.py` 파일에 공적 마스크 판매 정보(`get_ulsan_mask_stores`), 확진자 현황(`get_ulsan_status`), 확진자 정보 및 동선(`get_ulsan_status`)을 10분에 한번씩 실행하여 데이터베이스에 저장하는 함수들이 있습니다. 이 함수들을 각 지역에 맞게 수정해 주시면 됩니다. API를 사용해 보셨거나 `bs4`를 이용한 크롤링을 해보셨다면 아래의 가이드라인을 따라 쉽게 만드실 수 있습니다. 아래의 가이드는 **각 함수 내에 주석**으로 수정해야 할 부분이 표시되어 있으니, 그 부분을 따라서 수정해주시면 좀 더 편합니다.  

함수를 모두 구현하셨다면, 서비스 배포 직전(혹은 테스트를 위한 `runserver` 직전에)에 각 함수들을 `python3 manage.py shell`에서 한 번씩 실행하여 **데이터베이스를 업데이트(초기화)** 해주셔야 합니다. 이에 대한 설명은 함수 설명 후, 자세히 다루도록 하겠습니다.

#### 1. `get_mask_stores`
1. 공적 마스크 현황 정보를 가져오고 데이터베이스(`Mask` 모델)에 저장하는 함수. 매 실행시 데이터가 업데이트되는 방식이니 데이터가 쌓이지 않음.
2. `gu_list` 변수에 자신의 지역의 모든 시, 군, 구를 리스트 형태로 입력. ex) 경상남도 창원시

#### 2. `get_status`
1. 지역의 확진자 현황 정보를 가져오고 데이터베이스(`Statistics` 모델)에 저장하는 함수. 확진자 수, 완치자 수만 수합하도록 짜여있으나 추가 통계 자료는 커스터마이징 가능. 매 실행시 데이터가 추가되는 것이 아닌, 업데이트되는 방식이니 데이터가 쌓이지 않음.
2. 확진자 현황 정보를 보고하는 각 지자체 공식 홈페이지를 크롤링하여 사용용. **따라서, 별도의 크롤링 코드 필요.**
    1. `values` 변수에 `[<확진자 수>, <완치자 수>]` 형식의 리스트가 저장되도록 크롤링 진행.
    
#### 3. `get_patient`
1. 각 확진자에 대한 정보와 동선 정보를 가져오고 데이터베이스(`Patient` 모델)에 저장하는 함수. 매 실행시, **환자 번호를 기준으로** 업데이트되는 방식.
2. `patients` 변수가 아래의 형식으로 저장되도록 크롤링 진행. (이 변수의 `key`는 환자 번호입니다.)
~~~
patients = {
	1: {
		“ID”: 환자 식별자,
		“Gender”: 환자 성별,
		“Age”: 환자 나이,
		“Region”: 환자 지역,
		“Confirmed Date”:  확진 날짜,
		“Current Status”: 현재 상태(격리 장소, 퇴원 여부 등 기타 정보),
		“Paths”: raw 환자 동선 정보,
	},
	2: {
		“ID”: 환자 식별자,
		“Gender”: 환자 성별,
		“Age”: 환자 나이,
		“Region”: 환자 지역,
		“Confirmed Date”:  확진 날짜,
		“Current Status”: 현재 상태(격리 장소, 퇴원 여부 등 기타 정보),
		“Paths”: raw 환자 동선 정보,
	},
	…
}
~~~

#### 4. 데이터베이스 업데이트 방법
함수가 모두 성공적으로 짜여졌다면, 아래의 과정을 통해 데이터베이스를 업데이트 할 수 있어야 합니다.

1. `python3 manage.py shell` 로 Django shell에 접근합니다.
2. 아래의 명령어를 차례로 입력합니다.
~~~
>> from main.views import *
>> get_mask_stores()
>> get_status()
>> get_patients()
~~~
3. `/admin`주소에서 만들어 둔 superuser 계정으로 로그인 하여 데이터가 잘 입력됐는지 확인합니다.

>위의 함수 명을 변경했을 시에, "초기설정 3-5번의 CRON_JOBS" 리스트에 적절히 함수명을 변경하셔야 합니다.

  
## `/patient_admin` 주소를 통해 확진자 동선 추가하기
1. 위의 과정을 성공적으로 진행하셨다면, `/patient_admin`주소에 superuser로 로그인하여 통해 확진자 동선을 빠르게 추가하고 삭제할 수 있습니다. 현재는 **베타 버전**으로 제작이 되어 있는 상태라 디자인이 조잡하고 약간의 버그가 있을 수 있습니다.
2. 우측 상단에는 이미 데이터베이스(`PatientPath`)에 추가되어 있는 확진자 동선 목록이, 우측 하단에는 크롤링 된 확진자의 동선 정보가 나옵니다.
3. 좌측 상단에 목적지 검색을 통해 시설 검색을 진행할 수 있습니다. 목적지 검색은 검색 결과와 가장 유사한 장소를 결과로 리턴하며, 동시에 해당 장소로 지도가 이동합니다.
4. 장소 검색 후, **환자 번호**와 **다녀간 날짜**를 입력하고 추가하시면 됩니다. 날짜 입력란을 클릭하면 달력 UI가 출력되어 입력을 돕습니다.
5. 삭제는 우측 상단의 목록에서 하실 수 있습니다.
6. 추가와 삭제는 입력 직후 우측 상단 목록에 바로 반영되지 않습니다... 아직 업데이트 해야하는 부분이고 **새로고침**을 하면 정상적으로 출력됩니다.

  
## Thumbnail & Favicon

`main/static/main` 폴더 내에 자신의 썸네일(thumbnail.jpg)과 파비콘(favicon.ico)파일로 대체하시면 됩니다.

  
## 서비스 배포 방법

Django 프로젝트를 배포하신 적이 없다면 [AWS EC2 서비스를 통한 Django 배포 방법 포스트](https://nerogarret.tistory.com/45)를 참고해 주시길 바랍니다.

  
## 배포 직후

#### CRONJOBS 등록
서버의 `manage.py`가 있는 폴더에서 `python3 manage.py cron add`명령어를 입력하시면 "초기설정 3-5번의 CRON_JOBS" 리스트에 등록된 cron 스케쥴러가 작동합니다. `python3 manage.py cron show`를 통해 적절히 추가되었는지 확인할 수 있습니다. `log`를 저장할 폴더가 적절히 배치되었는지 확인해주세요. (초기 설정에 배치된 폴더는 `/home/ubuntu`입니다.) 잘 작동한다면 데이터베이스가 10분씩 자동으로 업데이트 되는 것을 확인하실 수 있습니다.

#### 공지사항
공지 사항은 index.html 파일의 `modal`요소에서 수정하실 수 있습니다.
---
