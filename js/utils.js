function Queue() 
{

    
    let items = [];

    this.push = function (element) 
    {
        items.push(element);
    }

    this.pop = function () 
    {
        return items.shift();
    }
    
    this.front = function () 
    {
        if (items.length === 0) 
        {
            return undefined
        }
        return items[0];
    }
    this.back = function () 
    {
        if (items.length === 0) 
        {
            return undefined
        }
        return items[items.length - 1]
    }

    
    this.isEmpty = function () 
    {
        return items.length === 0;
    }
    this.indexSatisfy = function (condition) 
    {
        for (let i = 0; i < items.length; i++) 
        {
            if (condition(items[i])) 
            {
                return i;
            }
        }
        return -1;
    }
    this.removeElementByIndex = function (index) 
    {
        if (index >= 0 && index < items.length) 
        {
            items.splice(index, 1)
        }
    }

    this.removeElementByCondition = function (condition) {
        let index = this.indexSatisfy(condition)
        if (index !== -1) {
            this.removeElementByIndex(index)
        }
    }
    this.size = function () 
    {
        return items.length;
    }
    this.clear = function () 
    {
        while (!this.isEmpty()) {
            this.pop();
        }
    }

    this.print = function () 
    {
        return items.toString();
    }
}

function string_repeat(target, n) 
{
    let s = target, total = "";
    while (n > 0) 
    {
        if (n % 2 === 1) 
        {
            total += s;
        }
        if (n === 1) 
        {
            break;
        }
        s += s;
        n = n >> 1;
    }
    return total;
}

function randomNum(minNum, maxNum) 
{
    switch (arguments.length) 
    {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}


let LoginUI = !!window.LoginUI || {};

LoginUI.getViewportWidth = function () {
    let width = 0;
    if (document.documentElement && document.documentElement.clientWidth) 
    {
        width = document.documentElement.clientWidth;
    } 
    else if (document.body && document.body.clientWidth) 
    {
        width = document.body.clientWidth;
    } 
    else if (window.innerWidth) 
    {
        width = window.innerWidth - 18;
    }
    return width;
}


LoginUI.getViewportHeight = function () {
    let height = 0;
    if (window.innerHeight) 
    {
        height = window.innerHeight;
    } 
    else if (document.documentElement && document.documentElement.clientHeight) 
    {
        height = document.documentElement.clientHeight;
    } 
    else if (document.body && document.body.clientHeight) 
    {
        height = document.body.clientHeight;
    }
    return height;
}

LoginUI.getViewportScrollX = function () {
    let scrollX = 0;
    if (document.documentElement && document.documentElement.scrollLeft) 
    {
        scrollX = document.documentElement.scrollLeft;
    } 
    else if (document.body && document.body.scrollLeft) 
    {
        scrollX = document.body.scrollLeft;
    } 
    else if (window.pageXOffset) 
    {
        scrollX = window.pageXOffset;
    } 
    else if (window.scrollX) 
    {
        scrollX = window.scrollX;
    }
    return scrollX;
}

LoginUI.getViewportScrollY = function () 
{
    let scrollY = 0;
    if (document.documentElement && document.documentElement.scrollTop) 
    {
        scrollY = document.documentElement.scrollTop;
    } 
    else if (document.body && document.body.scrollTop) 
    {
        scrollY = document.body.scrollTop;
    } 
    else if (window.pageYOffset) 
    {
        scrollY = window.pageYOffset;
    }
    else if (window.scrollY) 
    {
        scrollY = window.scrollY;
    }
    return scrollY;
}

function scrollMsgTip_just_for_bottom(id) 
{
    document.getElementById(id).style.display = "block";

    let t = LoginUI.getViewportHeight() +
        LoginUI.getViewportScrollY() - document.getElementById(id).offsetHeight;

    document.getElementById(id).style.top = t + "px";

}

function scrollMsgTip(id) 
{
    let t = LoginUI.getViewportHeight() +
        LoginUI.getViewportScrollY() - document.getElementById(id).offsetHeight;
    let building_bottom = document.getElementById('g-building').offsetHeight + document.getElementById('g-building').offsetTop
    if (t > building_bottom) {
        t = building_bottom
    }
    document.getElementById(id).style.top = t + "px";
}


let pin_to_bottom_elements_ids = []

function pin_element_to_bottom(id) 
{
    pin_to_bottom_elements_ids.push(id)
    scrollMsgTip(id);
}

function pin_to_bottom_elements() 
{
    for (let i = 0; i < pin_to_bottom_elements_ids.length; i++) 
    {
        scrollMsgTip(pin_to_bottom_elements_ids[i]);
    }
}

window.onload = pin_to_bottom_elements;
window.onscroll = pin_to_bottom_elements;
window.onresize = pin_to_bottom_elements;













