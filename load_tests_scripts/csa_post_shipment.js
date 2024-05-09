import { group, check } from "k6";
import http from "k6/http";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { Counter } from "k6/metrics";
// import file from 'k6/x/file';

// Result Counters
// const failed_data_file_path = 'failed_csa_shipment_results.txt';
const successStatus200Counter = new Counter('success_Status_code_200');
const errorStatus400Counter = new Counter('errors_Status_code_400');
const errorStatus422Counter = new Counter('errors_Status_code_422');
const errorStatus500Counter = new Counter('errors_Status_code_500');

// Result File
// const result_file_path = "../csa_post_shipment_transactionId_result_file.txt";

// Get Config
// const config = JSON.parse(open("../config.json")).csa;
const config = {
  "baseURL": "https://api-qa.kloudship.com:96/api/v1/",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NGNjOWFjNGQyMGQ0YjlmMmE2ZGRkMTgiLCJzaWQiOiI2NGNjOWFjNGQyMGQ0YjlmMmE2ZGRkMTciLCJTdWJBY2NvdW50SWQiOiI2NGNjOWFjNGQyMGQ0YjlmMmE2ZGRkMWIiLCJQcm9kdWN0SWQiOiI2NDYzODU5OWNjYTcxNWQwNjBhNjdhYjgiLCJBcGlDcmVkZW50aWFsSWQiOiIiLCJSb2xlIjoiMCIsIlRva2VuQWNjZXNzVHlwZSI6IjEiLCJJc1Rlc3QiOiJUcnVlIiwiUGF5bWVudFByb3ZpZGVyIjoiIiwiU3ViUGxhbiI6IjAiLCJhdWQiOlsiaHR0cHM6Ly9hcGktcWEua2xvdWRzaGlwLmNvbTo5MSIsImh0dHBzOi8vZWNzLXFhLmtsb3Vkc2hpcC5jb20iLCJodHRwczovL2FwaS1xYS5rbG91ZHNoaXAuY29tOjk2IiwiaHR0cHM6Ly9hcGktcWEua2xvdWRzaGlwLmNvbTo5NCIsImh0dHBzOi8vdG9vbHMtcWEua2xvdWRzaGlwLmNvbSJdLCJleHAiOjE3MTUzMjY1ODAsImlzcyI6Imh0dHBzOi8vYXV0aC1xYS5rbG91ZHNoaXAuY29tOjk3In0.YVMfEvajnnsL-u25dRgBTKDusD8HEFPKV-WgnWQgWeIkY8ujDcK_KrlD4wRfvrbnhRVpN2UBLiAJTaO7YYszztzb-Jyz2tCQLwGx4ERk1Z_hgzP672zSUDN9ihIYc9ItItMMqKXF2I2Y7W1Pd43x2hXT903rrfElL_6R8dP-S6YPffhDgw4X0fTus-KTtwGr_66QTWzM-gtt8jo8-1BibPHEP26ypxv21aAgg5zRjeWeyZMlqohk6PujNRzoWMaqBWG9ji1Iyf0-cisYWQPSBTgHLOqF7Qcl0-lQvBHE6qhZtge6zaQBaGD4IPp8OwxHojRGlCfDr2fSLBMjtBneew",
  "carrierAccountId": "64c7b9911175bfb7baaeb5cc",
  "locationId": "",
  "shipmentMode": "Test"
};

// Prepare request data 
const shipmentRequest = {
  addressShipTo: {
    name: "Mr. Forward",
    company: "Impledge Technologies",
    street1: "F 92 Sector 26",
    street2: "",
    city: "Noida",
    stateCode: "UP",
    zip: "201301",
    countryCode: "IN",
    phone: "9876543210",
    email: "demo-qa-admin@impledge.com",
    verify: false,
    // Lat/lng of sector-62 metro station (For hyper-local carriers)
    latitude: 28.617865356742037,
    longitude: 77.37299541473388
  },
  addressFrom: {
    name: "Mr. Shipper",
    company: "Impledge Technologies",
    street1: "Regus, 5th Floor, Tower C, Green Boulevard, B-Block, Sector 62",
    street2: "",
    city: "Noida",
    stateCode: "UP",
    zip: "201309",
    countryCode: "IN",
    phone: "9876543210",
    email: "demo-qa-admin@impledge.com",
    verify: false,
  },
  packages: [
    {
      packageType: "parcel",
      length: 2,
      width: 1,
      height: 1,
      dimensionUnit: "cm",
      weight: 0.5,
      weightUnit: "kg"
    },
  ],
  service: "Surface",
  carrierAccountId: config.carrierAccountId,
  label: {
    labelFileType: "pdf",
    labelSize: "4x6",
    labelOrientation: "Portrait"
  },
  items: [
    {
      productId: "123",
      productName: "Doll",
      Name: "Doll-Bargie-Angel",
      hSNCode: "1230818",
      sku: "1234",
      value: 12,
      quantity: 2,
      weight: 200,
      weightUnit: "g",
      // save: true,
      description: "",
      packageNumber: 1,
      category: "other",
      originCountry: "IN"
    }
  ],
  isTest: config.shipmentMode === "Test"
};

export default function postShipmentRequest() {
  // file.clearFile(result_file_path);
  group('Post shipment request', () => {
    const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'sort' });
    let transactionId = `TranS_${date}_${randomString(29, 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;
    const url = `${config.baseURL}shipment`;
    console.log(transactionId);
    let post_shipment_request = http.post(
      url,
      JSON.stringify(shipmentRequest),
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          TransactionId: transactionId,
          "Authorization": `Bearer ${config.token}`,
        }
      }
    );

    check(post_shipment_request, {
      'is status 200': (response) => response.status === 200
    });

    let shipmentResponse = JSON.parse(post_shipment_request.body);

    console.log(shipmentResponse);

    // Write transactionId for get shipment & refund for succesfull request
    if (post_shipment_request.status == 200) {
      // file.appendString(result_file_path, `${transactionId}`);
    }

    // Logs to help get information of failed requests on live executed load tests
    if (post_shipment_request.status != 200) {
      // file.appendString(failed_data_file_path, `'${transactionId}','${post_shipment_request.status}','${post_shipment_request.body}'\n`);
      // file.appendString(failed_data_file_path, `curl -X POST "${url}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${config.token}" -H "TransactionId: ${transactionId}" -d "${shipmentRequest}"\n`);

      // To console the response
      // console.log(post_shipment_request.status);
      // console.error(post_shipment_request.headers);
      // console.error(post_shipment_request.body);
    }
    switch (post_shipment_request.status) {
      case 0:
        errorStatusCounter.add(1);
        break;
      case 200:
        successStatus200Counter.add(1);
        break;
      case 400:
        errorStatus400Counter.add(1);
        break;
      case 422:
        errorStatus422Counter.add(1);
        break;
      case 500:
        errorStatus500Counter.add(1);
        break;
      default:
        break;
    }
  });
}
