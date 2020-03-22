## DB 업데이트 관련 함수
def get_ulsan_mask_stores():
    from pprint import pprint
    import json
    import requests

    url = "https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByAddr/json"
    headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
    gu_list = [
        "울산광역시 울주군",
        "울산광역시 남구",
        "울산광역시 북구",
        "울산광역시 동구",
        "울산광역시 중구",
    ]

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

    print("I GET DATA!")
    return ulsan_mask_stores

get_ulsan_mask_stores()