import request from "@/utils/request";


export default {

  queryWhale(data) {
    return request({
      url: '/whaleFall/queryWhale',
      method: 'POST',
      data
    })
  }

}
