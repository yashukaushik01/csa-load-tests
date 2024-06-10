import { group, check, sleep } from "k6";
import http from "k6/http";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { scenario } from 'k6/execution';
import { SharedArray } from 'k6/data';
import file from 'k6/x/file';
import { Counter } from 'k6/metrics';

// Get Config
const config = JSON.parse(open("../config.json")).csa;
var output = "";
const shipmentRefundRequest = {
    "CancelationReason": "Customer cancelled"
};

const shipmentId_list = new SharedArray('shipmentId_list', () => {
  let shipmentId_list = [];

  console.log('shipment ids', config.shipmentIds)
  // shipmentId_list = open("../phv3_post_shipment_transactionId_result_file.txt").split(/\n/);
  shipmentId_list = config.shipmentIds.split(',');

  return shipmentId_list;
});

export default function putRefundShipmentRequest() {
  // file.clearFile(result_file_path);
  group('Put refund shipment request', () => {
    console.log("scenario.iterationInTest", scenario.iterationInTest);
    console.log("shipmentId_list.length", shipmentId_list.length);

    let shipmentId = shipmentId_list[scenario.iterationInTest];

    const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'sort' });
    let transactionId = `TranS_${date}_${randomString(29, 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;

    const url = `${config.baseURL}/shipment/${shipmentId}/refund`;
    // console.log(transactionId);
    let put_refund_shipment_request = http.put(
      url,
      JSON.stringify(shipmentRefundRequest),
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          TransactionId: transactionId,
          "Authorization": `Bearer ${config.token}`,
        }
      }
    );

    check(put_refund_shipment_request, {
      'is status 200': (response) => response.status === 200
    });

    let shipmentResponse = JSON.parse(put_refund_shipment_request.body);

    // Write transactionId for get shipment & refund for succesfull request
    if (put_refund_shipment_request.status == 200) {
      output = "{" + ' ShipmentId: ' + ((shipmentResponse === null || shipmentResponse === undefined) ? '' : shipmentResponse.id) + '"' + "} , ";
      console.log(output);
      // file.appendString(result_file_path, `${transactionId}`);
    }

    // Logs to help get information of failed requests on live executed load tests
    if (put_refund_shipment_request.status != 200) {
      // file.appendString(failed_data_file_path, `'${transactionId}','${post_shipment_request.status}','${post_shipment_request.body}'\n`);
      // file.appendString(failed_data_file_path, `curl -X POST "${url}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${config.token}" -H "TransactionId: ${transactionId}" -d "${shipmentRequest}"\n`);

      // To console the response
      // console.log(post_shipment_request.status);
      // console.error(post_shipment_request.headers);
      // console.error(post_shipment_request.body);
    }
    sleep(1);
  });
}
