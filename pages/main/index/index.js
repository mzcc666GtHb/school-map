// const app = getApp()
import Notify from '../../../miniprogram_npm/@vant/weapp/notify/notify'
const windowHeight = wx.getSystemInfoSync().windowHeight // 屏幕的高度
const windowWidth = wx.getSystemInfoSync().windowWidth // 屏幕的宽度
const ratio = 750 / windowWidth
const { qqMapTranslate, getSchoolDetailById, getHouseDetailById, getPlaceList, getHouseNearby, getSchoolNearby, baiduMapTranslate } = require('../../../api/school-map')
const { translateQQLocation } = require('../../../utils/index')
const { houseNatrue, schoolNatrue, schoolType } = require('../../../dict/index')
Page({
  data: {
    latitude: 31.079337,
    longitude: 121.592369,
    tabsShow: true,
    searchType: '',
    searchShow: false,
    searchFocus: false,
    duration: 300,
    position: 'center',
    round: false,
    overlay: true,
    searchValue: '',
    scroll_height: '',
    pageNo: 1,
    pageSize: 15,
    currentPage: 1,
    list: [],
    pages: 0,
    searchLoading: false,
    loadFinished: false,
    loadError: false,
    houses: [],
    schoolName: '',
    schoolAddress: '',
    showOverlay: false,
    colors: ['#ee0a24'],
    polygons: [],
    markers: [],
    includePoints: [],
    customCalloutMarker: [],
    mapScale: 14,
    list2: [],
    activeName: '',
    markers2: [],
    showFilterPopup: false,
    showPlaceCard: false,
    showNearBy: true,
    placeInfo: {
      desc: '',
      title: '',
      imgSrc: '',
      price: '',
      plate: '',
      buildDate: '',
      tags: [],
      placeType: '',
      hasImg: false
    },
    hisList: []
  },
  onLoad() {
    this.setData({
      scroll_height: (windowHeight - 60) * ratio
    })
    const that = this
    wx.getStorage({
      key: 'historySearch',
      success(res) {
        that.setData({
          hisList: res.data
        })
      }
    })
  },
  onUnload() {
  },
  onShow() {
  },
  async onReady() {
    // 创建地图实例
    this.mapCtx = wx.createMapContext('myMap')

    // 初始化中心点
    await this.initCenter()
    const initPos = await this.getCurPos()
    const { longitude, latitude } = initPos
    this.initNearby(latitude, longitude)
    // 设置窗口高度
  },
  // 获取当前位置
  getCurPos() {
    return new Promise((resolve, rejeect) => {
      wx.getLocation({
        type: 'gcj02',
        altitude: true,
        isHighAccuracy: true,
        success(res) {
          resolve(res)
        },
        fail(err) {
          rejeect(err)
        }
      })
    })
  },
  // 设置中心点
  setCenter(longitude, latitude) {
    this.setData({
      longitude: longitude,
      latitude: latitude
    })
  },
  // 百度转qq坐标
  async getActiveLocation(lat, lng) {
    const translateRes = await qqMapTranslate({
      locations: `${lat},${lng}`
    })
    if (!translateRes.locations && translateRes.message) {
      Notify({ type: 'danger', message: translateRes.message, duration: 1500 })
      wx.hideLoading()
      return
    }
    return {
      latitude: translateRes.locations[0].lat,
      longitude: translateRes.locations[0].lng
    }
  },
  async initCenter() {
    const initPos = await this.getCurPos()
    const { longitude, latitude } = initPos
    if (longitude && latitude) {
      this.setCenter(longitude, latitude)
    }
  },
  showSearch(e) {
    const { dataset: { type }} = e.currentTarget
    this.setData({ searchType: type, searchShow: true, tabsShow: false, searchFocus: true, searchValue: '' })
    Notify.clear()
    // wx.navigateTo({
    //   url: '/pages/placeList/index'
    // })
  },

  // search-page
  onAfterLeave(res) {
    this.initSearch()
    this.setData({ searchShow: false, tabsShow: true })
  },
  onSearch() {
    const { searchType } = this.data
    this.getData('init', searchType)
  },
  onChangeSearch(e) {
    const { searchType } = this.data
    this.setData({
      searchValue: e.detail
    })
    this.getData('init', searchType)
  },
  onChangeBlur() {
    return
  },
  onCancel() {
    this.initSearch()
    this.setData({ searchShow: false, tabsShow: true })
  },
  initSearch() {
    this.setData({
      pageNo: 1,
      pageSize: 15,
      currentPage: 1,
      list: [],
      pages: 0,
      searchLoading: false,
      loadFinished: false
    })
  },
  // 获取列表数据
  getData(handleType, searchType) {
    const { pageSize, searchValue } = this.data
    if (!searchValue) {
      return
    }
    if (handleType === 'init') {
      console.log('handleType', handleType)
      this.initSearch()
    } else {
      this.setData({
        pageNo: this.data.currentPage,
        searchLoading: true
      })
    }
    // 获取列表
    getPlaceList({
      name: searchValue,
      area: '浦东新区',
      city: '上海市',
      province: '上海市',
      pageNo: this.data.pageNo,
      pageSize
    }, searchType).then(res => {
      if (!res.success) {
        this.setData({ loadError: true })
        return
      }
      const { result } = res
      const pageData = this.data.list
      if (!result.records.length) {
        this.setData({ loadFinished: true, searchLoading: false })
        return
      }
      this.setData({
        list: handleType === 'init' ? result.records : pageData.concat(result.records),
        searchLoading: false,
        pages: result.pages,
        loadFinished: result.records.length < this.data.pageSize
      })
    }).catch(err => {
      console.log(err)
    })
  },
  // 上拉加载更多
  loadMore() {
    const self = this
    // 当前页是最后一页
    if (self.data.currentPage === self.data.pages) {
      this.setData({
        loadFinished: true
      })
      return
    }
    setTimeout(function() {
      let tempCurrentPage = self.data.currentPage
      tempCurrentPage = tempCurrentPage + 1
      self.setData({
        currentPage: tempCurrentPage
      })
      const { searchType } = self.data
      self.getData('loadMore', searchType)
    }, 300)
  },
  // 选择
  async renderMap(locId, placeType, isCallouttap = false) {
    wx.showLoading({
      title: '加载中...'
    })

    const placeDetailRes = await this.getPlaceDetailByIdAndType(locId, placeType)
    const { detailRes, list } = placeDetailRes
    const { lat, lng, id, name, address, type } = detailRes
    if (!lat || !lng) {
      Notify({ type: 'danger', message: '经纬度返回为空', duration: 1500 })
      wx.hideLoading()
      return
    }

    // 初始化卡片信息
    this.initPlaceInfo(detailRes, placeType)

    // 百度坐标转qq地图
    const activeLocation = await this.getActiveLocation(lat, lng)
    const { latitude, longitude } = activeLocation
    // 拿到列表,组装makers
    const markers = this.getMarkers(list, placeType)

    // 所搜的学校或者小区的maker
    const activeMarker = {
      id: id,
      type: placeType,
      latitude: latitude,
      longitude: longitude,
      width: 1,
      height: 1,
      iconPath: '../image/pin.png',
      callout: {
        content: name,
        color: '#ffffff',
        fontSize: 14,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#ee0a24',
        bgColor: '#ee0a24',
        padding: 4,
        display: 'ALWAYS',
        textAlign: 'center'
      }
    }
    const customCallout = {
      id: 9999999,
      latitude: latitude,
      longitude: longitude,
      width: 1,
      height: 1,
      count: markers.length,
      iconPath: '../image/pin.png',
      customCallout: {
        anchorY: 0,
        anchorX: 0,
        display: 'ALWAYS'
      }
    }
    markers.push(activeMarker)
    if (markers.length < 21 || isCallouttap) {
      this.setData({
        searchShow: false,
        tabsShow: true,
        customCalloutMarker: [],
        houses: list,
        schoolName: name,
        schoolAddress: address,
        markers
      })
    } else {
      this.setData({
        markers2: markers,
        activeName: name,
        searchShow: false,
        tabsShow: true,
        customCalloutMarker: [customCallout],
        houses: list,
        schoolName: name,
        schoolAddress: address,
        markers: [customCallout]
      })
    }
    if (type === 1) {
      this.mapCtx.includePoints({ points: this.getPoints(markers), padding: [20, 100, 20, 100] })
    }
    this.mapCtx.moveToLocation(activeLocation)
    wx.hideLoading()
    Notify({
      color: '#fff',
      background: 'rgba(1,1,1,.7)',
      type: 'success',
      message: `已选-${name}`,
      duration: 0
    })
  },
  onSelectItem(e) {
    const locId = e.currentTarget.id
    const { type } = e.currentTarget.dataset.place // type--2 对应小区,type--1 对应学校
    this.setData({
      showNearBy: false
    })
    wx.nextTick(() => {
      this.renderMap(locId, type)
    })
    this.save()
  },

  async getPlaceDetailByIdAndType(id, type) {
    let detailRes = {}
    let list = []
    switch (type) {
      case 1:
        detailRes = await getSchoolDetailById({ id })
        list = detailRes.result.houses
        break
      case 2:
        detailRes = await getHouseDetailById({ id })
        list = detailRes.result.schools
        break
      default:
        break
    }
    return {
      detailRes: detailRes.result,
      list
    }
  },
  getMarkers(list, placeType, isNearby) {
    const markers = []
    Array.isArray(list) && list.forEach(item => {
      const marker = {}
      const { latitude, longitude } = translateQQLocation(item.qqLocation)
      marker.id = item.placeId
      marker.latitude = latitude
      marker.longitude = longitude
      marker.width = 1
      marker.height = 1
      marker.iconPath = '../image/pin.png'
      marker.callout = {
        content: item.name,
        color: '#ffffff',
        fontSize: 14,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#07c160',
        bgColor: '#07c160',
        padding: 4,
        display: 'ALWAYS',
        textAlign: 'center'
      }
      if (marker.latitude && marker.longitude) {
        markers.push(marker)
      }
      if (!isNearby) {
        marker.type = placeType === 1 ? 2 : 1
      } else {
        marker.type = placeType
      }
    })
    return markers
  },
  getPoints(markers) {
    const points = []
    markers.forEach(item => {
      const { latitude, longitude } = item
      if (latitude && longitude) {
        points.push({
          latitude,
          longitude
        })
      }
    })
    return points
  },
  onClickListItem(e) {
    console.log(e)
    const { id: markerId } = e.currentTarget
    if (!Number.isNaN(+markerId)) {
      // this.activeTab(+markerId, () => {
      //   this.setData({ showOverlay: false })
      // })
      // wx.navigateTo({
      //   url: 'pages/placeList/index'
      // })
    }
  },
  showHouses() {
    this.setData({ showOverlay: true })
  },
  hideHouses() {
    this.setData({ showOverlay: false })
  },
  async bindcallouttap(e) {
    const { markerId } = e.detail
    this.setData({
      showNearBy: false
    })
    if (markerId === 9999999) {
      this.setData({ customCalloutMarker: [], markers: this.data.markers2 })
      return
    }
    const activeMarker = this.getActiveMarkerById(markerId)
    const { type } = activeMarker
    await this.renderMap(markerId, type, true)
    this.showPlaceCard()
  },
  getActiveMarkerById(markerId) {
    let result = {}
    this.data.markers.forEach(item => {
      if (item.id === markerId) {
        result = { ...item }
      }
    })
    return result
  },
  bindmarkertap(e) {
    console.log(e)
  },
  regionchange(e) {
    if (this.data.showNearBy && (e.type === 'end')) {
      const { detail } = e
      console.log(detail)
      const { centerLocation } = detail
      const { latitude, longitude } = centerLocation
      this.initNearby(latitude, longitude)
    }
  },
  showRightPopup() {
    this.setData({
      showFilterPopup: true
    })
  },
  showNearByPlace() {
    const that = this
    that.setData({
      showNearBy: true
    })
    that.mapCtx.getCenterLocation({
      success(res) {
        const { latitude, longitude } = res
        that.initNearby(latitude, longitude)
      }
    })
  },
  onCloseFilterPopup() {
    this.setData({
      showFilterPopup: false
    })
  },
  onClosePlaceCard() {
    this.closePlaceCard()
  },
  showPlaceCard() {
    this.setData({
      showPlaceCard: true
    })
  },
  closePlaceCard() {
    this.setData({
      showPlaceCard: false
    })
  },
  initPlaceInfo(activePlace, placeType) {
    console.log(activePlace)
    let placeTags = []
    let placeNature
    let schoolTypeText
    let imgSrc
    const { nature, address, name, city, area, price, plate, buildDate, imageUrl, type } = activePlace
    const hasImg = !!imageUrl
    switch (placeType) {
      case 1:
        placeNature = schoolNatrue[nature]
        schoolTypeText = schoolType[type]
        imgSrc = imageUrl || '../image/camera.png'
        break
      case 2:
        placeNature = houseNatrue[nature]
        schoolTypeText = ''
        imgSrc = imageUrl || '../image/camera.png'
        break
      default:
        break
    }
    placeTags = [placeNature, schoolTypeText].filter(item => item)
    console.log(placeTags)
    this.setData({
      placeInfo: {
        desc: city + area + address,
        title: name,
        imgSrc: imgSrc,
        tags: placeTags,
        price: price,
        plate,
        buildDate,
        placeType: placeType,
        hasImg
      }
    })
  },
  async getNearbySchool(nearbyData) {
    const res = await getSchoolNearby(nearbyData)
    return res
  },
  async getNearbyHouse(nearbyData) {
    const res = await getHouseNearby(nearbyData)
    return res
  },
  async initNearby(latitude, longitude, distance = 1) {
    const coords = `${longitude},${latitude}`
    const baiduPos = await baiduMapTranslate({ coords })
    const baiduPosresult = baiduPos.result[0]
    const { result } = await this.getNearbySchool({
      distance,
      longitude: baiduPosresult.x,
      latitude: baiduPosresult.y
    })
    const markers = this.getMarkers(result, 1, true)
    this.setData({
      searchShow: false,
      showPlaceCard: false,
      tabsShow: true,
      customCalloutMarker: [],
      houses: result,
      markers
    })
    Notify.clear()
  },
  backToOrigin() {
    this.mapCtx.moveToLocation(this.latitude, this.longitude)
    this.onReady()
  },
  save() {
    var list = this.data.hisList
    if (list.indexOf(this.data.searchValue) === -1 & this.data.searchValue !== '') {
      list.push(this.data.searchValue)
    }
    this.setData({
      hisList: list
    })
    wx.setStorage({
      key: 'historySearch',
      data: list
    })
  },
  searchName(e) {
    this.setData({
      searchValue: e.currentTarget.dataset.value
    })
    const { searchType } = this.data
    this.getData('init', searchType)
  },
  remove() {
    const that = this
    wx.showModal({
      title: '提示',
      content: '确认清空所有记录?',
      success(res) {
        if (res.confirm) {
          wx.removeStorage({
            key: 'historySearch',
            success() {
              that.setData({
                hisList: []
              })
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  clean() {
    setTimeout(() => {
      this.setData({
        searchValue: ''
      })
    }, 100)
  }
})
