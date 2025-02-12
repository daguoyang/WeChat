Page({
  data: {
    qrCodeUrl: ''
  },

  onLoad: function() {
    this.getQRCode()
  },

  getQRCode: function() {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getWXACode',
    }).then(res => {
      console.log(res);
      if (res.result.code === 0) {
        // 从云存储获取小程序码图片
        wx.cloud.getTempFileURL({
          fileList: [res.result.fileID],
          success: res => {
            this.setData({
              qrCodeUrl: res.fileList[0].tempFileURL
            })
          }
        })
      } else {
        wx.showToast({
          title: '获取小程序码失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error(err);
      wx.showToast({
        title: '获取小程序码失败',
        icon: 'none'
      })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  saveImage: function() {
    wx.showLoading({
      title: '保存中...',
    })
    
    wx.downloadFile({
      url: this.data.qrCodeUrl,
      success: function(res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function() {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            })
          },
          fail: function() {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      },
      fail: function() {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      },
      complete: function() {
        wx.hideLoading()
      }
    })
  },

  onShareAppMessage: function() {
    return {
      title: '嗨森去水印工具',
      path: 'pages/wxcode/index'
    }
  }
}) 