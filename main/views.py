from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, HttpResponse
from pprint import pprint
from main.models import Mask, Statistics, PatientPath, Patient
from dateutil.parser import parse as date_parse
from datetime import datetime
from bs4 import BeautifulSoup
from django.core.mail import send_mail
import time
import json
import requests
# from main import patient_crawl

# Create your views here.
def main(requests):
    masks = Mask.objects.all()
    statistics = {}
    statistics["infected"] = Statistics.objects.get(name="infected").value + Statistics.objects.get(name="cured").value
    statistics["cured"] = Statistics.objects.get(name="cured").value

    paths = PatientPath.objects.all()
    return render(requests, "main/index.html", {"masks": masks, "statistics": statistics, "paths": paths})

@staff_member_required
def patient_admin(requests):
    registered_paths = PatientPath.objects.all()[::-1]
    patients = Patient.objects.all()[::-1]
    raw_paths = [{"raw_paths": patient.paths, "code": patient.code} for patient in patients]
    return render(requests, "main/patient_admin.html", {"paths": registered_paths, "patients": patients})

@staff_member_required
def path_add(requests):
    data = requests.POST
    x = data.get('x')
    y = data.get('y')
    patient_code = int(data.get('patient_code'))
    visited_date = date_parse(data.get('visited_date'))
    place_name = data.get('place_name')

    if Patient.objects.filter(code=patient_code): patient = Patient.objects.get(code=patient_code)
    else:
        context = {
            "type": "error",
            "message": "해당 번호의 확진자가 존재하지 않습니다."
        }
        return HttpResponse(json.dumps(context), content_type="application/json")

    PatientPath.objects.create(
        patient=patient,
        x=x,
        y=y,
        visited_date=visited_date,
        place_name=place_name,
    )

    # else:
    context = {
        "type": "success",
        "message": "확진자 동선을 추가하였습니다.",
    }
    print(x, y, visited_date, patient_code, place_name)


    return HttpResponse(json.dumps(context), content_type="application/json")

@staff_member_required
def path_delete(requests):
    pk = int(requests.POST.get("pk"))
    print(requests.POST.get("pk"))
    path = PatientPath.objects.get(pk=pk).delete()
    context = {
        "message": "what",
    }
    return HttpResponse(json.dumps(context), content_type="application/json")

########### 이 밑에 있는 함수들을 모두 짠 후 배포 직전에 모두 한 번씩 실행하여 데이터베이스를 초기화 해주셔야 합니다. #################
def get_ulsan_mask_stores():
    url = "https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByAddr/json"
    headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }

    ####################### 자기 지역의 시, 군, 구를 모두 입력 ###############################
    gu_list = [
        # "울산광역시 울주군",
        # "울산광역시 남구",
        # "울산광역시 북구",
        # "울산광역시 동구",
        # "울산광역시 중구",
    ]
    ###################################################################################

    ulsan_mask_stores = {
        'stores': [],
        'count': 0,
    }
    for gu in gu_list:
        params = {
            'address': gu
        }
        mask_json = json.loads(requests.get(url, params=params, headers=headers).text)
        # pprint(mask_json)
        ulsan_mask_stores['count'] += mask_json['count']
        ulsan_mask_stores['stores'] += mask_json['stores']

    newly_registered = []
    for store in ulsan_mask_stores['stores']:
        addr = store["addr"] if "addr" in store and store["addr"] else None
        code = store["code"] if "code" in store and store["code"] else None
        # created_at = date_parse(store["created_at"]) if "created_at" in store and store["created_at"] else None
        latitude = store["lat"] if "lat" in store and store["lat"] else None
        longitude = store["lng"] if "lng" in store and store["lng"] else None
        name = store["name"] if "name" in store and store["name"] else None
        remain_stat = store["remain_stat"] if "remain_stat" in store and store["remain_stat"] else None
        stock_at = date_parse(store["stock_at"]) if "stock_at" in store and store["stock_at"] else None
        place_type = store["type"] if "type" in store and store["type"] else None

        if Mask.objects.filter(code=code):
            mask = Mask.objects.get(code=code)
            mask.addr = addr
            mask.code = code
            # mask.created_at = created_at
            mask.latitude = latitude
            mask.longitude = longitude
            mask.name = name
            mask.remain_stat = remain_stat
            mask.stock_at = stock_at
            mask.place_type = place_type
            mask.save()
        else:
            newly_registered.append(code)
            mask = Mask(
                addr=addr,
                code=code,
                # created_at=created_at,
                latitude=latitude,
                longitude=longitude,
                name=name,
                remain_stat=remain_stat,
                stock_at=stock_at,
                place_type=place_type,
            )
            mask.save()

    update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log = "{}: Total searched store {}, Newly registered stores: {}".format(update_time, ulsan_mask_stores['count'], newly_registered)
    print(log)
    # return ulsan_mask_stores

def get_ulsan_status():
    ####################### 자기 지역의 동선 정보를 업데이트해주는 공식 홈페이지로 변경 ###############################
    # url = "http://www.ulsan.go.kr/corona.jsp"
    ####################################################################################################

    headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
    req = requests.get(url, headers=headers)
    r = req.text

    soup = BeautifulSoup(r, "html.parser")
    # table = soup.find(id="patients2")

    # 목록이 추가되면 수정하기
    names = ["infected", "cured"]

    ############# values = [‘확진자 수를 포함한 html 태그’, ‘완치자 수를 포함한 html태그’] 가 되도록 select ##########
    # values = soup.select(".num_people")
    #####################################################################################################

    statistics = {}
    for i, name in enumerate(names):
        value = int(values[i].text)
        statistics[name] = value
        updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if Statistics.objects.filter(name=name):
            statistic = Statistics.objects.get(name=name)
            statistic.name = name
            statistic.value = value
            statistic.save()
        else:
            statistic = Statistics(
                name=name,
                value=value,
            )
            statistic.save()

    print(statistics)
    log = "{}: Current infected patients {}, Current cured patients: {}".format(updated_at, statistics['infected'],  statistics['cured'])
    print(log)

def get_ulsan_patients():
    ############################# 각자의 지역에 따라 크롤링을 하셔야 합니다 ##################################
    # url = "http://www.ulsan.go.kr/corona.jsp"
    # headers = {
    #     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    # }
    # req = requests.get(url, headers=headers)
    # r = req.text

    # soup = BeautifulSoup(r, "html.parser")

    # table = soup.find(id="patients")
    # # columns = [column.text for column in table.select("thead th")]

    # patients_rows = list(table.select("tbody tr"))[::-1]

    # total_patients = int(len(patients_rows) / 2)
    # # print(total_patients)
    # patients = {}

    # patient_num = 1
    # for num, row in enumerate(patients_rows):
    #     # print(patient_num)
    #     if num % 2 == 0:
    #         patients[patient_num] = {}
    #         patients[patient_num]["Paths"] = [path.text for path in row.select('.corona-move li')]
    #     else:
    #         informations = [info.text for info in row.select('td')]
    #         # print(informations)
    #         patients[patient_num]["ID"] = informations[0]

    #         patient_details = informations[1].split("/")
    #         patients[patient_num]["Gender"] = patient_details[0]
    #         patients[patient_num]["Age"] = patient_details[1]
    #         patients[patient_num]["Region"] = patient_details[2]

    #         patients[patient_num]["Confirmed Date"] = informations[3]
    #         patients[patient_num]["Current Status"] = informations[4]

    #         patient_num += 1

    ############################# 여기까지 아래의 형식대로 patients가 저장되어야 합니다. ##################################
    '''
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
    '''
    ################################# 맞췄다면 여기부턴 변경하지 말 것. ########################################

    updated_patient = []
    for number, patient_info in patients.items():
        updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patient, is_existed = Patient.objects.get_or_create(code=number)

        old_path = patient.paths
        new_path = json.dumps(patient_info["Paths"], ensure_ascii=False)
        
        if old_path != new_path: updated_patient.append(str(number))
            
        patient.gender=patient_info["Gender"]
        patient.age=patient_info["Age"]
        patient.paths=json.dumps(patient_info["Paths"], ensure_ascii=False)
        patient.region=patient_info["Region"]
        patient.confirmed_date=date_parse(patient_info["Confirmed Date"])
        patient.current_status=patient_info["Current Status"]
        patient.save()
    
    # print(updated_patient)
    if updated_patient: send_mail("환자 업데이트: "+", ".join(updated_patient), ", ".join(updated_patient) + "번 환자의 동선이 업데이트 되었습니다.", 'coronaulsan@gmail.com', ['coronaulsan@gmail.com'], fail_silently=False)
    log = "{}: Total patients: {}".format(updated_at, total_patients)
    print(log)