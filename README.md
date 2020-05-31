# How to Use

```
// Import Lib
import { getItemsFromListWhenReady } from 'mx-widget-utils';

// Normal list
getItemsFromListWhenReady(this.props.MileStoneChartData, true); // is a list

// splitBy or Modifirer funtion
this.getItemsFromListWhenReady(this.props.MileStoneChartData, false, ",", (data) => {
    return data.reduce((acc, item) => {
        acc.push(item.toUpperCase().replace(/ /g, "_"))
        return acc;
    }, [])
});


```
