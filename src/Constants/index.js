export const PATHNAME = window.location.pathname || '';


export const LI_LEVEL =  {
    'deliurl' : '구매대행',
    'import' : '수입대행',
    'delivery' : '배송대행',
};
export const LI_STATE =  {
    'AA' : '견적대기',
    'AB' : '견적제출보류',
    'AC' : '결제대기(견적완료)',
    'AD' : '결제실패',
    'AE' : '입금확인중',
    'AF' : '상품결제완료',
    'AZ' : '신청취소(상품)',

    'BA' : '미완료신청건',
    'BB' : '입고대기',
    'BC' : '부분입고',
    'BD' : '입고완료(견적대기)',
    'BE' : '물류비결제대기',
    'BF': '물류비입금확인중',
    'BG' : '물류비결제실패',
    'BH' : '물류비결제완료',
    'BI' : '출고대기',
    'BJ' : '부분출고',
    'BK' : '출고완료',
    'BX' : '신청취소(배송)',
    'BZ' : '배송취소',

    'CA' : '배송완료',
    'CB' : '전액환불',
};
export const LI_STATE_HINT =  {
    'AA' : '견적확인 중에 있으며 통상적으로 1일이내 견적을 드립니다(주말 및 공휴일을 제외) 상품 및 품목수가 많은 경우 시간이 좀 더 소요될 수 있습니다',
    'AB' : '견적을 내는 도중 문제가 된 상품이 있어 견적제출이 보류되었습니다 상품취소목록에서 문의하기를 클릭하여 해당 상품을 취소하고 견적드릴지 여부를 알려주세요',
    'AC' : '상품구매대행관련 견적서가 발급되었습니다 보다 빠른 대행 진행을 위해 결제하기 버튼을 클릭하여 결제를 진행해 주세요',
    'AD' : '결제실패',
    'AE' : '무통장입금건에 대하여 입금확인중에 있습니다 입금이 확인이 완료되면 대행상품의 구매가 진행됩니다',
    'AF' : '결제가 완료되어 대행상품의 구매가 진행될 예정입니다',
    'AZ' : '신청취소(상품)',

    'BA' : '주문한 중국 쇼핑몰에서 트래킹번호를 확인하여 에그돔에 트래킹번호가 입력되었는지 확인해주세요',
    'BB' : '대행요청한 상품의 구매가 완료되었습니다 중국 내 창고로의 입고를 기다리고 있습니다',
    'BC' : '중국 내 물류창고로 일부 상품이 입고되었습니다 대행신청한 상품이 모두 입고완료 처리되면 물류비(배송비)를 산정하여 안내드립니다',
    'BD' : '모든 상품이 중국 내 물류창고로 입고된 상태입니다 물류비(배송비) 산정을 위한 견적중에 있습니다',
    'BE' : '창고에 모든 상품이 입고되어 물류비 산정이 완료된 상태입니다 보다 빠른 한국으로의 상품출고를 위해 결제하기 버튼을 클릭하여 물류비 결제를 진행해 주세요',
    'BF': '물류비입금이 완료되었는지 확인중입니다 물류비 입금이 확인완료되면 한국으로의 출고 작업이 진행됩니다',
    'BG' : '물류비결제실패',
    'BH' : '물류비입금이 완료되었습니다 한국으로의 출고 작업을 진행중입니다',
    'BI' : '출고대기',
    'BJ' : '대행요청한 상품 중 일부 상품이 한국으로 출고 되었습니다',
    'BK' : '출고완료',
    'BX' : '신청취소(배송)',
    'BZ' : '배송취소',

    'CA' : '배송완료',
    'CB' : '전액환불',
};
export const LIP_ORDER =  {
    'A' : '중국내출고대기', 
    'C' : '중국내배송중', 
    'E' : '이상처리(답변대기)', 
    'F' : '이상처리(답변완료)', 
    'B' : '입고완료(출고작업중)', 
    'J' : '상품취소(인증필요)', 
    'K' : '상품취소(납기일 이슈)', 
    'L' : '상품취소(단가변동)', 
    'M' : '상품취소(품절)', 
    'N' : '상품취소', 
    'D' : '출고대기', 
    'Y' : '출고완료', 
    'Z' : '결제완료',
};
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB38_phb3gMvvMmx78ctz8zpVlyZK_30W8",
    authDomain: "AIzaSyB38_phb3gMvvMmx78ctz8zpVlyZK_30W8",
    projectId: "eggdome-a5abd",
    storageBucket: "eggdome-a5abd.appspot.com",
    messagingSenderId: "311676243005",
    appId: "1:311676243005:web:632f197d56c78fd70a6e54",
    measurementId: "G-H6LWB9F1YL"
};

