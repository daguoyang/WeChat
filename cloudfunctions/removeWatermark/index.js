const cloud = require('wx-server-sdk');
const https = require('https');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 测试函数
async function testRequest() {
  try {
    const testUrl = 'https://www.baidu.com'
    console.log('[测试] 开始测试网络请求:', testUrl)
    
    const response = await new Promise((resolve, reject) => {
      https.get(testUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      }, (res) => {
        console.log('[测试] 收到响应:', res.statusCode)
        resolve(res)
      }).on('error', reject)
    })
    
    console.log('[测试] 网络请求正常')
    return true
  } catch (error) {
    console.error('[测试] 网络请求失败:', error)
    return false
  }
}

// 识别链接类型
function detectPlatform(url) {
  if (url.includes('xhslink.com')) return 'xiaohongshu';
  if (url.includes('douyin.com')) return 'douyin';
  if (url.includes('kuaishou.com')) return 'kuaishou';
  return 'unknown';
}

// 提取链接
function extractUrl(text) {
  try {
    console.log('[提取] 开始提取链接，输入:', text)
    // 匹配多种平台的链接
    const patterns = {
      xiaohongshu: /https?:\/\/xhslink\.com\/[a-zA-Z0-9\/]+/,
      douyin: /https?:\/\/v\.douyin\.com\/[a-zA-Z0-9\/]+/,
      kuaishou: /https?:\/\/v\.kuaishou\.com\/[a-zA-Z0-9\/]+/
    }

    for (const [platform, regex] of Object.entries(patterns)) {
      const match = text.match(regex)
      if (match) {
        console.log('[提取] 成功:', platform, match[0])
        return {
          platform,
          url: match[0]
        }
      }
    }

    console.log('[提取] 失败: 未找到匹配链接')
    return null
  } catch (error) {
    console.error('[提取] 错误:', error)
    return null
  }
}

// 提取小红书链接
function extractXhsUrl(text) {
  console.log('\n[提取链接] 开始')
  console.log('[提取链接] 输入文本:', text)
  
  try {
    // 修改正则表达式以更准确地匹配链接
    const regex = /http:\/\/xhslink\.com\/[a-zA-Z0-9\/]+/
    console.log('[提取链接] 使用正则:', regex.toString())
    
    const match = text.match(regex)
    console.log('[提取链接] 匹配结果:', match)
    
    if (match) {
      const url = match[0].trim()
      console.log('[提取链接] 成功, 提取到URL:', url)
      return url
    }
    
    console.log('[提取链接] 失败: 未找到匹配链接')
    return null
  } catch (error) {
    console.error('[提取链接] 错误:', error.message)
    return null
  }
}

// 获取重定向后的URL并提取图片
async function getRedirectUrl(urlInfo) {
    console.log('[重定向] 开始')
    try {
        // 如果是对象，提取 url 属性
        const targetUrl = typeof urlInfo === 'object' ? urlInfo.url : urlInfo
        console.log('[重定向] 请求URL:', targetUrl)

        const response = await axios.get(targetUrl, {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400
            }
        })

        // 检查是否有重定向
        if (response.request.res.responseUrl) {
            return response.request.res.responseUrl
        }

        if (response.headers.location) {
            return response.headers.location
        }

        return targetUrl
    } catch (error) {
        if (error.response && error.response.headers.location) {
            return error.response.headers.location
        }
        console.log('[错误] 完整错误:', error)
        throw error
    }
}

// 从笔记页面提取图片链接
async function extractImagesFromNote(noteUrl) {
  try {
    console.log('[笔记] 开始请求:', noteUrl)
    const response = await axios.get(noteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
      }
    })

    // 使用正则表达式匹配图片URL
    const imageRegex = /https:\/\/ci\.xiaohongshu\.com\/[^\s"']+/g
    const matches = response.data.match(imageRegex)
    
    if (matches && matches.length > 0) {
      console.log('[笔记] 找到图片:', matches)
      return matches.map(url => {
        // 添加图片参数以获取高质量版本
        return url + '?imageView2/2/w/1080/format/jpg'
      })
    }
    
    throw new Error('未找到图片')
  } catch (error) {
    console.error('[笔记] 提取图片错误:', error)
    throw error
  }
}

// 处理小红书链接
async function handleXiaohongshu(url) {
  try {
    const redirectUrl = await getRedirectUrl(url)
    return {
      type: 'image', // 小红书默认为图片类型
      url: redirectUrl,
      platform: 'xiaohongshu'
    }
  } catch (error) {
    throw new Error('小红书链接处理失败: ' + error.message)
  }
}

// 测试网络连接
async function testNetwork() {
  try {
    console.log('[测试] 开始测试网络连接')
    const testUrl = 'https://www.baidu.com'
    const response = await new Promise((resolve, reject) => {
      https.get(testUrl, { timeout: 5000 }, (res) => {
        console.log('[测试] 网络正常, 状态码:', res.statusCode)
        resolve(res)
      }).on('error', reject)
    })
    return response.statusCode === 200
  } catch (error) {
    console.error('[测试] 网络连接失败:', error)
    return false
  }
}

// 修改正则表达式以匹配小红书链接格式
const xhsLinkRegex = /http:\/\/xhslink\.com\/[a-zA-Z0-9]+/;
const imageRegex = /https:\/\/ci\.xiaohongshu\.com\/[^\s?"]+/;

async function fetchPage(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        },
        maxRedirects: 5,
        timeout: 10000
    })
    return response.data
}

// 云函数入口函数
exports.main = async (event, context) => {
    console.log('开始处理请求:', event)
    
    try {
        const url = extractUrl(event.url)
        console.log('处理URL:', url)
        
        const redirectUrl = await getRedirectUrl(url)
        console.log('重定向URL:', redirectUrl)
        
        const html = await fetchPage(redirectUrl)
        console.log('页面长度:', html.length)
        console.log('[调试] HTML 预览:', html.substring(0, 1000))

        // 使用 cheerio 加载 HTML
        const $ = cheerio.load(html)
        const imageUrls = new Set()

        // 修改提取标题和描述的部分
        let title = '', desc = '';

        // 从 title 标签提取标题
        const titleMatch = html.match(/<title>(.*?) - 小红书<\/title>/);
        if (titleMatch) {
            title = titleMatch[1];
            console.log('从title标签提取到的标题:', title);
        }

        // 从 meta description 提取描述
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
        if (descMatch) {
            desc = descMatch[1];
            // 处理描述文本，移除多余空格
            desc = desc.trim();
            console.log('从meta标签提取到的描述:', desc);
        }

        // 如果上述方法失败，使用备用方法
        if (!title || !desc) {
            // 尝试从 JSON 数据中提取
            const noteDataMatch = html.match(/"title":"(.*?)","desc":"(.*?)","user":/);
            if (noteDataMatch) {
                title = title || noteDataMatch[1];
                desc = desc || noteDataMatch[2];
                
                // 处理转义字符
                title = title.replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n')
                            .replace(/\\/g, '');
                            
                desc = desc.replace(/\\"/g, '"')
                          .replace(/\\n/g, '\n')
                          .replace(/\\/g, '')
                          .replace(/\[话题\]/g, '');
                          
                console.log('从JSON数据提取到的内容:', { title, desc });
            }
        }

        // 输出调试信息
        console.log('最终提取结果:', { title, desc });

        // 尝试直接匹配图片ID
        const allMatches = html.match(/1040g[a-z0-9]+(?=!nd_[a-z_0-9]+)/g)
        if (allMatches) {
            console.log('找到所有可能的图片ID:', allMatches)
            allMatches.forEach(id => {
                console.log('处理图片ID:', id)
                const url = `https://sns-img-qc.xhscdn.com/${id}?imageView2/format/webp`
                imageUrls.add(url)
            })
        }

        const urlMatches = html.match(/https?:\/\/[^"'\s]+1040g[^"'\s]+/g)
        if (urlMatches) {
            console.log('找到所有可能的图片URL:', urlMatches)
            urlMatches.forEach(url => {
                const idMatch = url.match(/1040g[a-z0-9]+(?=!nd_)/)
                if (idMatch) {
                    console.log('从URL中提取图片ID:', idMatch[0])
                    const cleanUrl = `https://sns-img-qc.xhscdn.com/${idMatch[0]}?imageView2/format/webp`
                    imageUrls.add(cleanUrl)
                }
            })
        }

        if (imageUrls.size === 0) {
            // 输出一小段包含1040g的内容
            const context = html.split('1040g').map(part => {
                const start = Math.max(0, part.length - 50)
                const end = Math.min(part.length, 100)
                return part.slice(start, end)
            })
            console.log('包含1040g的上下文:', context)
            return { code: -1, msg: '未找到图片' }
        }

        const result = Array.from(imageUrls)
        console.log('找到图片数量:', result.length)
        console.log('第一张图片URL:', result[0])

        return {
            code: 0,
            data: result,
            title: title || '',
            desc: desc || '',
            msg: result.length > 0 ? 'success' : '未找到图片'
        }

    } catch (error) {
        console.error('处理失败:', error)
        return {
            code: -1,
            msg: error.message
        }
    }
} 