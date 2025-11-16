<template>
<trading-vue :data="chart" :width="this.width" :height="this.height"
        :color-back="colors.colorBack"
        :color-grid="colors.colorGrid"
        :color-text="colors.colorText"
        :title-txt="'TVue3 Example Chart'"
        :toolbar="true"
    >
</trading-vue>
</template>

<script>
import TradingVue from './TradingVue.vue'
import Data from '../data/data.json'
import DataCube from '../src/helpers/datacube.js'

export default {
    name: 'app',
    components: {
        TradingVue
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize)
        window.dc = this.chart
        
        // // Проверяем, что tools инициализированы
        // console.log('DataCube tools:', this.chart.data.tools)
        // console.log('DataCube tool:', this.chart.data.tool)
        
        // // Если tools не инициализированы, добавляем базовые инструменты
        // if (!this.chart.data.tools || this.chart.data.tools.length === 0) {
        //     console.warn('Tools не найдены, инициализируем базовые инструменты...')
        //     this.chart.data.tools = [
        //         {
        //             type: 'Cursor',
        //             icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII='
        //         }
        //     ]
        //     this.chart.data.tool = 'Cursor'
        // }
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize)
    },
    data() {
        return {
            chart: new DataCube(Data),
            width: window.innerWidth,
            height: window.innerHeight,
            colors: {
                colorBack: '#fff',
                colorGrid: '#eee',
                colorText: '#333',
            }
        };
    }
};
</script>

<style>
html,
body {
    background-color: #000;
    margin: 0;
    padding: 0;
    overflow: hidden;
}
</style>
