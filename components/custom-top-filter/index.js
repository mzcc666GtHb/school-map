Component({
  options: {
    styleIsolation: 'shared'
  },
  data: {
    showOverlay: false,
    dropDownIdList: ['#areaDropdown', '#placeTypeDropdown', '#publicOrPrivteDropDown', '#levelDropDown', '#moreDropDown']
  },
  properties: {
    area: {
      type: Array,
      value: [
        {
          // 导航名称
          text: '区域',
          // 禁用选项
          disabled: false,
          // 该导航下所有的可选项
          children: [
            {
              // 名称
              text: '不限',
              // id，作为匹配选中状态的标识
              id: 101
            },
            {
              text: '浦东',
              id: 102
            },
            {
              text: '虹口',
              id: 103,
              disabled: true
            },
            {
              text: '闵行',
              id: 103,
              disabled: true
            }
          ]
        },
        {
          text: '附近',
          children: [
            {
              text: '1km',
              id: 201
            },
            {
              text: '2km',
              id: 202
            },
            {
              text: '3km',
              id: 203
            }
          ]
        }
      ]
    },
    areaTitle: {
      type: String,
      value: '区域'
    },
    areaActiveIndex: {
      type: Number,
      value: 0
    },
    areaActiveId: {
      type: Number,
      value: 101
    },
    schoolTypes: {
      type: Array,
      value: [
        {
          type: 'nursery',
          name: '幼儿园'
        },
        {
          type: 'primary',
          name: '小学'
        },
        {
          type: 'junior',
          name: '初中'
        }
      ]
    },
    schoolType: 'primary',
    publicOrPrivte: {
      type: Array,
      value: []
    },
    levels: {
      type: Array,
      value: []
    },
    more: {
      type: String,
      value: ''
    },
    distance: {
      type: Number,
      value: 1
    }
  },
  methods: {
    onClickSearch() {
      this.triggerEvent('onClickSearch')
    },
    onClickNav(data) {
      this.triggerEvent('onClickNav')
    },
    onClickItem() {
      this.triggerEvent('onClickItem')
    },
    onClickOverlay() {
      // const { dropDownIdList } = this.data
      // dropDownIdList.forEach(item =>
      //   this.selectComponent(item).toggle(false)
      // )
      this.triggerEvent('onClickOverlay')
    },
    onOpenDropdown() {
      this.triggerEvent('onOpenDropdown')
      this.setData({
        showOverlay: true
      })
    },
    onCloseDropdown() {
      this.triggerEvent('onCloseDropdown')
      this.setData({
        showOverlay: false
      })
    }
  }
})