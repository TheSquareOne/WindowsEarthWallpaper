#include "web.h"

int main(void) { getWebsiteHeader("https://example.com"); }

int getWebsiteHeader(char *url) {

    CURL *curl = curl_easy_init();

    if(curl) {
        CURLcode ress_code;
        CURLHcode header_code;
        struct curl_header *type;

        // Set URL.
        curl_easy_setopt(curl, CURLOPT_URL, "https://example.com");

        /*
        This fixed error: SSL peer certificate or SSH remote key was not OK
        Download updated cacert.pem from https://curl.se/docs/caextract.html
        */
        curl_easy_setopt(curl, CURLOPT_CAINFO, "libcurl/bin/cacert.pem");

        // This removes body and makes HEAD request.
        curl_easy_setopt(curl, CURLOPT_NOBODY, 1);

        ress_code = curl_easy_perform(curl);

        curl_easy_cleanup(curl);

        header_code = curl_easy_header(curl, "Date", 0, CURLH_HEADER, -1, &type);

        return 0;
    }

    return 1;
}