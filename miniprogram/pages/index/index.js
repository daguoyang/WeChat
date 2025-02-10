Page({
  data: {
    url: '',
    resultData: null,
    loading: false,
    showProgress: false,
    currentDownload: 0,
    totalImages: 0
  },

  onInput(e) {
    this.setData({
      url: e.detail.value
    });
  },

  parseUrl() {
    if (!this.data.url) {
      wx.showToast({
        title: '请输入链接',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '解析中...' });

    wx.cloud.callFunction({
      name: 'removeWatermark',
      data: { url: this.data.url },
      success: res => {
        console.log('云函数返回数据：', res);
        if (res.result.code === 0) {
          // 处理视频和图片
          this.setData({ 
            resultData: {
              // 如果是视频，则将云函数返回的视频地址（存储在 data 字段）赋给 resultData.data
              data: res.result.type === 'video' ? res.result.data : '',
              // 如果是图片，则保留 urls 字段
              urls: res.result.type === 'image' ? res.result.data : [],
              title: res.result.title || '',
              desc: res.result.desc || '',
              type: res.result.type
            }
          });
        } else {
          wx.showToast({
            title: res.result.msg || '解析失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('云函数调用失败：', err);
        wx.showToast({
          title: '解析失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  },

  downloadAll() {
    // 检查是否有解析结果
    if (!this.data.resultData) {
      wx.showToast({
        title: '请先解析链接',
        icon: 'none'
      });
      return;
    }

    // 处理视频下载
    if (this.data.resultData.type === 'video') {
      wx.showLoading({ title: '下载中...' });
      wx.downloadFile({
        url: this.data.resultData.data,
        success: res => {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({ 
                title: '视频已保存', 
                icon: 'success' 
              });
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ 
                title: '保存失败', 
                icon: 'none' 
              });
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ 
            title: '下载失败', 
            icon: 'none' 
          });
        }
      });
      return;
    }

    // 处理图片下载（原有逻辑）
    if (!this.data.resultData.urls?.length) {
      wx.showToast({
        title: '没有可下载的内容',
        icon: 'none'
      });
      return;
    }
    
    const totalImages = this.data.resultData.urls.length;
    this.setData({
      showProgress: true,
      currentDownload: 0,
      totalImages
    });

    const downloadNext = (index) => {
      if (index >= totalImages) {
        // 全部下载完成
        this.setData({ showProgress: false });
        wx.showToast({ title: '下载完成', icon: 'success' });
        return;
      }

      const url = this.data.resultData.urls[index];
      wx.downloadFile({
        url,
        success: res => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              this.setData({ currentDownload: index + 1 });
              // 下载下一张
              downloadNext(index + 1);
            },
            fail: () => {
              this.setData({ showProgress: false });
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        },
        fail: () => {
          this.setData({ showProgress: false });
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      });
    };

    // 开始下载第一张
    downloadNext(0);
  },

  onRefresh() {
    this.setData({
      url: '',
      resultData: null
    });
  },

  copyText() {
    if (!this.data.resultData?.title && !this.data.resultData?.desc) {
      wx.showToast({
        title: '暂无文案',
        icon: 'none'
      });
      return;
    }

    const textToCopy = [
      this.data.resultData.title ? `标题：${this.data.resultData.title}` : '',
      this.data.resultData.desc ? `\n描述：${this.data.resultData.desc}` : ''
    ].filter(Boolean).join('\n');

    wx.setClipboardData({
      data: textToCopy,
      success: () => {
        wx.showToast({
          title: '文案已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.resultData.urls
    });
  },

  copyImageUrl(e) {
    const { url } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  copyVideoUrl() {
    if (!this.data.resultData?.data) {
      wx.showToast({
        title: '暂无视频链接',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.resultData.data,
      success: () => {
        wx.showToast({
          title: '视频链接已复制',
          icon: 'success'
        });
      }
    });
  }
});
