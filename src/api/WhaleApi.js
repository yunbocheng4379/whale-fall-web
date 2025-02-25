import request from "@/utils/request";


export default {

  queryWhale(data) {
    return request({
      url: '/test/test',
      method: 'POST',
      data
    })
  }

}
