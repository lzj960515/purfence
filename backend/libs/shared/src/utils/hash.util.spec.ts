import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { md5, md5File, md5Hmac, sha256Hmac } from './hash.util';

describe('Digest utility test', () => {
  describe('md5', () => {
    describe('hex', () => {
      it('string', () => {
        const data = '好的';
        const hash = '375ec8858f2e8ec21295958624199520';
        expect(hash).toEqual(md5(data));
      });

      it('object', () => {
        const data = { test: 'ok' };
        const hash = '6fdebd876f0c39f0951abadad6c99d0a';
        expect(hash).toEqual(md5(data));
      });

      it('buffer', () => {
        const data = Buffer.from('好的');
        const hash = '375ec8858f2e8ec21295958624199520';
        expect(hash).toEqual(md5(data));
      });

      it('array', () => {
        const data = [1, 2, 3, '好的', { test: 'ok' }];
        const hash = '01199bbb1bfdbc80e86882a57cca8f04';
        expect(hash).toEqual(md5(data));
      });
    });

    describe('base64', () => {
      it('string', () => {
        const data = '测试';
        const hash = '2wbHjR4kz3CKFM6BybYX7A==';
        expect(hash).toEqual(md5(data, 'base64'));
      });
    });
  });

  describe('md5Hmac', () => {
    describe('hex', () => {
      it('string', () => {
        const key = 'key';
        const data = '好的';
        const hash = '3216d17a3429599deb0e0e0b23af6e3a';
        expect(hash).toEqual(md5Hmac(key, data));
      });
    });
  });

  describe('md5File', () => {
    const dir = path.join(__filename, '../../../../tmp');
    const file = path.join(dir, `md5-sample-file-${randomUUID()}.txt`);
    beforeAll(() => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, 'hello world!');
    });

    afterAll(() => {
      fs.unlinkSync(file);
    });

    it('file', async () => {
      const hash = await md5File(file);
      expect(hash).toEqual('fc3ff98e8c6a0d3087d515c0473f8677');
    });
  });

  describe('sha256Hmac', () => {
    it('shopify', () => {
      const computed = sha256Hmac(
        'b5b491c3d728f74e031cecd79905cbff6feba4ed2c73c95785b07466225250b1',

        `{"id":820982911946154508,"email":"jon@doe.ca","closed_at":null,"created_at":"2022-05-15T23:08:21-04:00","updated_at":"2022-05-15T23:08:21-04:00","number":234,"note":null,"token":"123456abcd","gateway":null,"test":true,"total_price":"4810.00","subtotal_price":"4800.00","total_weight":0,"total_tax":"0.00","taxes_included":false,"currency":"USD","financial_status":"voided","confirmed":false,"total_discounts":"5.00","total_line_items_price":"4805.00","cart_token":null,"buyer_accepts_marketing":true,"name":"#9999","referring_site":null,"landing_site":null,"cancelled_at":"2022-05-15T23:08:21-04:00","cancel_reason":"customer","total_price_usd":null,"checkout_token":null,"reference":null,"user_id":null,"location_id":null,"source_identifier":null,"source_url":null,"processed_at":null,"device_id":null,"phone":null,"customer_locale":"en","app_id":null,"browser_ip":null,"landing_site_ref":null,"order_number":1234,"discount_applications":[{"type":"manual","value":"5.0","value_type":"fixed_amount","allocation_method":"each","target_selection":"explicit","target_type":"line_item","description":"Discount","title":"Discount"}],"discount_codes":[],"note_attributes":[],"payment_gateway_names":["visa","bogus"],"processing_method":"","checkout_id":null,"source_name":"web","fulfillment_status":"pending","tax_lines":[],"tags":"","contact_email":"jon@doe.ca","order_status_url":"https:\\/\\/hellopietra.myshopify.com\\/25255968856\\/orders\\/123456abcd\\/authenticate?key=abcdefg","presentment_currency":"USD","total_line_items_price_set":{"shop_money":{"amount":"4805.00","currency_code":"USD"},"presentment_money":{"amount":"4805.00","currency_code":"USD"}},"total_discounts_set":{"shop_money":{"amount":"5.00","currency_code":"USD"},"presentment_money":{"amount":"5.00","currency_code":"USD"}},"total_shipping_price_set":{"shop_money":{"amount":"10.00","currency_code":"USD"},"presentment_money":{"amount":"10.00","currency_code":"USD"}},"subtotal_price_set":{"shop_money":{"amount":"4800.00","currency_code":"USD"},"presentment_money":{"amount":"4800.00","currency_code":"USD"}},"total_price_set":{"shop_money":{"amount":"4810.00","currency_code":"USD"},"presentment_money":{"amount":"4810.00","currency_code":"USD"}},"total_tax_set":{"shop_money":{"amount":"0.00","currency_code":"USD"},"presentment_money":{"amount":"0.00","currency_code":"USD"}},"line_items":[{"id":866550311766439020,"variant_id":29843442761816,"title":"18k yellow gold long earrings","quantity":1,"sku":"","variant_title":null,"vendor":null,"fulfillment_service":"manual","product_id":3991616782424,"requires_shipping":true,"taxable":true,"gift_card":false,"name":"18k yellow gold long earrings","variant_inventory_management":"shopify","properties":[],"product_exists":true,"fulfillable_quantity":1,"grams":0,"price":"4800.00","total_discount":"0.00","fulfillment_status":null,"price_set":{"shop_money":{"amount":"4800.00","currency_code":"USD"},"presentment_money":{"amount":"4800.00","currency_code":"USD"}},"total_discount_set":{"shop_money":{"amount":"0.00","currency_code":"USD"},"presentment_money":{"amount":"0.00","currency_code":"USD"}},"discount_allocations":[],"duties":[],"admin_graphql_api_id":"gid:\\/\\/shopify\\/LineItem\\/866550311766439020","tax_lines":[]},{"id":141249953214522974,"variant_id":39940170678360,"title":"lpeng2-B","quantity":1,"sku":"2","variant_title":null,"vendor":null,"fulfillment_service":"manual","product_id":7111585955928,"requires_shipping":true,"taxable":true,"gift_card":false,"name":"lpeng2-B","variant_inventory_management":"shopify","properties":[],"product_exists":true,"fulfillable_quantity":1,"grams":454,"price":"5.00","total_discount":"5.00","fulfillment_status":null,"price_set":{"shop_money":{"amount":"5.00","currency_code":"USD"},"presentment_money":{"amount":"5.00","currency_code":"USD"}},"total_discount_set":{"shop_money":{"amount":"5.00","currency_code":"USD"},"presentment_money":{"amount":"5.00","currency_code":"USD"}},"discount_allocations":[{"amount":"5.00","discount_application_index":0,"amount_set":{"shop_money":{"amount":"5.00","currency_code":"USD"},"presentment_money":{"amount":"5.00","currency_code":"USD"}}}],"duties":[],"admin_graphql_api_id":"gid:\\/\\/shopify\\/LineItem\\/141249953214522974","tax_lines":[]}],"fulfillments":[],"refunds":[],"total_tip_received":"0.0","original_total_duties_set":null,"current_total_duties_set":null,"payment_terms":null,"admin_graphql_api_id":"gid:\\/\\/shopify\\/Order\\/820982911946154508","shipping_lines":[{"id":271878346596884015,"title":"Generic Shipping","price":"10.00","code":null,"source":"shopify","phone":null,"requested_fulfillment_service_id":null,"delivery_category":null,"carrier_identifier":null,"discounted_price":"10.00","price_set":{"shop_money":{"amount":"10.00","currency_code":"USD"},"presentment_money":{"amount":"10.00","currency_code":"USD"}},"discounted_price_set":{"shop_money":{"amount":"10.00","currency_code":"USD"},"presentment_money":{"amount":"10.00","currency_code":"USD"}},"discount_allocations":[],"tax_lines":[]}],"billing_address":{"first_name":"Bob","address1":"123 Billing Street","phone":"555-555-BILL","city":"Billtown","zip":"K2P0B0","province":"Kentucky","country":"United States","last_name":"Biller","address2":null,"company":"My Company","latitude":null,"longitude":null,"name":"Bob Biller","country_code":"US","province_code":"KY"},"shipping_address":{"first_name":"Steve","address1":"123 Shipping Street","phone":"555-555-SHIP","city":"Shippington","zip":"40003","province":"Kentucky","country":"United States","last_name":"Shipper","address2":null,"company":"Shipping Company","latitude":null,"longitude":null,"name":"Steve Shipper","country_code":"US","province_code":"KY"},"customer":{"id":115310627314723954,"email":"john@test.com","accepts_marketing":false,"created_at":null,"updated_at":null,"first_name":"John","last_name":"Smith","orders_count":0,"state":"disabled","total_spent":"0.00","last_order_id":null,"note":null,"verified_email":true,"multipass_identifier":null,"tax_exempt":false,"phone":null,"tags":"","last_order_name":null,"currency":"USD","accepts_marketing_updated_at":null,"marketing_opt_in_level":null,"email_marketing_consent":{"state":"not_subscribed","opt_in_level":null,"consent_updated_at":null},"sms_marketing_consent":null,"admin_graphql_api_id":"gid:\\/\\/shopify\\/Customer\\/115310627314723954","default_address":{"id":715243470612851245,"customer_id":115310627314723954,"first_name":null,"last_name":null,"company":null,"address1":"123 Elm St.","address2":null,"city":"Ottawa","province":"Ontario","country":"Canada","zip":"K2H7A8","phone":"123-123-1234","name":"","province_code":"ON","country_code":"CA","country_name":"Canada","default":true}}}`,
        'base64',
      );
      expect(computed).toEqual('hHLYpiQFYsCO82YZ3h7OuNsYg3QBY2VlLu25L5A7NXA=');
      const s = sha256Hmac('Pietra4ActiveCampaign', 'st-6lrz32lwq6m8le', 'hex');
      console.log(s);
    });

    it('cart-rover', () => {
      const data = `{"orders":[{"created_date_time":"2022-05-31T06:46:18+00:00","updated_date_time":"2022-05-31T06:46:18+00:00","record_no":"27","version":null,"format":null,"cust_ref":"27","cust_po_no":"27","po_number":null,"carrier":null,"ship_code":"","ship_code_description":"expedited shipping","working_ship_code":null,"cust_company":null,"cust_title":null,"cust_first_name":"peng","cust_last_name":"liu","cust_address_1":"81 Prospect Street","cust_address_2":null,"cust_address_3":null,"cust_city":"Brooklyn","cust_state":"NY","cust_zip":"11201","cust_country":"USA","cust_phone":"4084776594","cust_e_mail":"pan@pietrastudio.com","ship_company":null,"ship_title":null,"ship_first_name":null,"ship_last_name":null,"ship_address_1":null,"ship_address_2":null,"ship_address_3":null,"ship_city":null,"ship_state":null,"ship_zip":null,"ship_country":null,"ship_phone":"4084776594","ship_e_mail":"pan@pietrastudio.com","ship_address_type":null,"special_services":null,"customer_id":"218035900","order_date":"2022-05-30","sub_total":"10.00","order_discount":"0.00","sales_tax":"0.00","shipping_handling":"0.00","grand_total":"10.00","balance":"0.00","currency_code":"USD","credit_card_no":null,"expiration_date":null,"pay_type":"CA","tax_exempt_sw":null,"installment_program":null,"media_week":null,"order_source":"WooCommerce","promo_code":null,"ani_phone":null,"vendor_phone":null,"check_account_no":null,"check_type":null,"check_no":null,"check_bank_id":null,"check_cust_bank":null,"check_cust_id_num":null,"check_cust_id_state":null,"check_cust_id_mm":null,"check_cust_id_dd":null,"check_cust_id_yy":null,"check_cust_id_type":null,"location":null,"shipping_instructions":null,"ship_account_no":null,"ship_account_zip":null,"pre_auth_code":null,"pre_auth_amt":"0.00","pre_auth_id":null,"cvv":null,"custom_field_1":null,"custom_field_2":null,"custom_field_3":null,"custom_field_4":null,"custom_field_5":null,"gift_card_sw":null,"token_sw":null,"cass_code_ship":null,"cass_error_ship":null,"cass_code_cust":null,"cass_error_cust":null,"cass_date":null,"ncoa_code_ship":null,"ncoa_code_cust":null,"ncoa_date":null,"error_code":null,"error_msg":null,"ifraud_error_code":null,"xfraud_error_code":null,"credit_error_code":null,"resubmit_date":null,"black_list":null,"credit_score":null,"fraud_score":null,"load_override_sw":null,"fail_action":null,"action_dt":null,"filename":null,"call_queue":null,"clerk_disposition":null,"clerk_disp_dt":null,"rep_disposition":null,"rep_disp_dt":null,"duplicate_sw":null,"weight":null,"org_file_no":null,"gift_message":null,"gift_wrap":null,"delete_date":null,"routing_sw":"N","sent_to_region":null,"accepted_by_region":null,"regional_center":null,"regional_order_no":null,"regional_ship_date":null,"regional_retry_sw":"N","regional_error":null,"regional_attempts":"0","first_attempt":null,"cancel_date":null,"cc_last_four":null,"expected_delivery_date":null,"requested_ship_date":null,"delivered_to_wms_date":null,"error_reason":null,"mark_in_progress_date":null,"extra_system_date_sent":null,"sending_canceled":"N","shipping_pickup_canceled":"N","on_hold":"N","num_failed_sends":"0","latest_ship_date":null,"log_documents_in":"[\\"6295b9b8d9c1e5330f0d89a2\\",\\"6295b9b8d9c1e5330f0d89a3\\"]","items":[{"line_no":"1","item":"lp_sku_010","lot_number":null,"quantity":1,"price":"10.0000","discount":"0.0000","addl_discount":"0.0000","extended_amount":"10.00","tax":"0.00","shipping_surcharge":"0.00","line_item_id":null,"line_comment":null,"Description":"lptest product 010","alt_sku":null,"filtered_sku":"N","line_location":""}],"shipments":[]}]}`;
      const key = `j7PECA05fdZXHUb`;
      const computed = sha256Hmac(key, data, 'hex');
      const expected = `10aa1920d4abdab0b8de08685bd38736b296ea423a7b058b0a94150566852c54`;

      expect(computed).toEqual(expected);
    });
  });
});
