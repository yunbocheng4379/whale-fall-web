import request from "@/utils/request";


export default {

  login(data) {
    return request({
      url: 'user/login',
      method: 'POST',
      data
    })
  }

}
