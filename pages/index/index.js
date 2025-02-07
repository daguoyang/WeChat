Page({
  data: {
    url: '',
    images: [],
    loading: false
  },

  onInput(e) {
    this.setData({
      url: e.detail.value
    })
  },

  async parseUrl() {
    if (!this.data.url) {
      wx.showToast({
        title: '请输入链接',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'removeWatermark',
        data: {
          type: 'parse',
          url: this.data.url
        }
      })

      if (result.code === 0) {
        this.setData({ 
          images: result.data,
          url: ''
        })
      } else {
        throw new Error(result.msg || '解析失败')
      }
    } catch (err) {
      wx.showToast({
        title: err.message,
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset
    console.log('当前点击的图片:', url)
    console.log('所有图片列表:', this.data.images)
    
    // 确保所有图片URL都是完整的
    const urls = this.data.images.map(imgUrl => {
      // 如果URL不是以http开头，添加协议
      if (!imgUrl.startsWith('http')) {
        return `https:${imgUrl}`
      }
      return imgUrl.replace(/!.*$/, '') // 移除可能的URL参数
    })

    wx.previewImage({
      current: url, // 当前显示图片的链接
      urls: urls,   // 需要预览的图片链接列表
      success: () => {
        console.log('预览成功')
      },
      fail: (err) => {
        console.error('预览失败:', err)
        wx.showToast({
          title: '图片预览失败',
          icon: 'none'
        })
      }
    })
  },

  async saveImage(e) {
    const { url } = e.currentTarget.dataset
    wx.showLoading({ title: '保存中...' })
    
    try {
      await wx.downloadFile({
        url,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
            },
            fail: () => {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        }
      })
    } catch (err) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  copyImageUrl(e) {
    const { url } = e.currentTarget.dataset
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  }
}) 