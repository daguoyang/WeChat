const cloud = require('wx-server-sdk')
cloud.init({
  env: 'dev-8g0z1vi3ec714fd3' // 替换为你的环境ID
})

exports.main = async (event, context) => {
  try {
    console.log("开始生成小程序码");
    const result = await cloud.openapi.wxacode.getUnlimited({
      page: 'pages/wxcode/index',
      scene: 'a=1',
      checkPath: true,
      envVersion: 'release',
    });
    console.log("小程序码生成成功", result);
    
    // 上传小程序码到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: 'qrcode/minicode.jpg',
      fileContent: result.buffer,
    });

    return {
      result,
      code: 0,
      fileID: uploadResult.fileID
    };

  } catch (err) {
    console.error("生成小程序码失败", err);
    return {
      code: -1,
      error: err
    };
  }
} 