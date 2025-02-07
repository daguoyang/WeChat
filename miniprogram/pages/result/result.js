// pages/result/result.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    images: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('接收到的参数：', options)
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data))
        console.log('解析后的数据：', data)
        this.setData({
          images: data.data || [],
          title: '获取成功，点击图片可放大查看'
        })
      } catch (err) {
        console.error('数据解析失败：', err)
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.images,
      current: url
    })
  },

  onCopyLink(e) {
    const url = e.currentTarget.dataset.url
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  onClear() {
    this.setData({
      images: []
    })
    wx.showToast({
      title: '已清空',
      icon: 'success'
    })
  },

  onDownloadAll() {
    wx.showModal({
      title: '提示',
      content: '观看视频广告即可下载全部图片',
      success: (res) => {
        if (res.confirm) {
          this.showAd()
        }
      }
    })
  },

  showAd() {
    wx.showToast({
      title: '广告播放完成',
      icon: 'success'
    })
  }
})