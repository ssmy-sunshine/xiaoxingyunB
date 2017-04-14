/*前台调用
 *$("#id .class").html("xxx").find("xxx").css("xxx").addClass("xx").click("xxx").href("xx").show("xx")

 选择器仅支持：
  $('#div1') ID选择器
  $('.aCur') 类选择器
  $('div') 元素选择器
  $('#div1 li') 组合选择器
//暂不支持$('#div1 , .cls') 和 属性选择器 还有其他复杂的选择器也不支持

 * 特别提醒:
 * $("xxx").click(fn);//是绑定tap事件,不是onclick,所以添加点击事件就用此方法,fu中的this就是dom元素;
 * $("xxx").href(url,param);//给按钮绑定tap事件,打开新窗口mui.openWindow;
 */
var $ = function(args) {
	return new DomBiz(args);
}

/*选择器*/
function DomBiz(args) {
	//创建一个数组，来保存获取的节点和节点数组
	this.elements = [];

	if (typeof args == 'string') {
		//css模拟
		if (args.indexOf(' ') != -1) {
			var elements = args.split(' '); //把节点拆开分别保存到数组里
			var childElements = []; //存放临时节点对象的数组，解决被覆盖的问题
			var node = []; //用来存放父节点用的
			for (var i = 0; i < elements.length; i++) {
				if (node.length == 0) node.push(document); //如果默认没有父节点，就把document放入
				switch (elements[i].charAt(0)) {
					case '#':
						childElements = []; //清理掉临时节点，以便父节点失效，子节点有效
						childElements.push(this.getId(elements[i].substring(1)));
						node = childElements; //保存父节点，因为childElements要清理，所以需要创建node数组
						break;
					case '.':
						childElements = [];
						for (var j = 0; j < node.length; j++) {
							var temps = this.getClass(elements[i].substring(1), node[j]);
							for (var k = 0; k < temps.length; k++) {
								childElements.push(temps[k]);
							}
						}
						node = childElements;
						break;
					default:
						childElements = [];
						for (var j = 0; j < node.length; j++) {
							var temps = this.getTagName(elements[i], node[j]);
							for (var k = 0; k < temps.length; k++) {
								childElements.push(temps[k]);
							}
						}
						node = childElements;
				}
			}
			this.elements = childElements;
		} else {
			//find模拟
			switch (args.charAt(0)) {
				case '#':
					var ele=this.getId(args.substring(1));
					if (ele) this.elements.push(ele);
					break;
				case '.':
					this.elements = this.getClass(args.substring(1));
					break;
				default:
					this.elements = this.getTagName(args);
			}
		}
	} else if (typeof args == 'object') {
		if (args != undefined) { //this是一个对象，undefined也是一个对象
			this.elements[0] = args;
		}
	}
}

//获取ID节点
DomBiz.prototype.getId = function(id) {
	return document.getElementById(id)
};

//获取元素节点数组
DomBiz.prototype.getTagName = function(tag, parentNode) {
	if (parentNode) {
		return parentNode.getElementsByTagName(tag);
	} else {
		return document.getElementsByTagName(tag);
	}
};

//获取CLASS节点数组
DomBiz.prototype.getClass = function(className, parentNode) {
	if (parentNode) {
		return parentNode.getElementsByClassName(className);
	} else {
		return document.getElementsByClassName(className);
	}
}

//设置CSS选择器子节点,limit限定的数量
DomBiz.prototype.find = function(str,limit) {
	var childElements = [];
	for (var i = 0; i < this.elements.length; i++) {
		switch (str.charAt(0)) {
			case '#':
				var ele=this.getId(str.substring(1));
				if (ele) childElements.push(ele);
				break;
			case '.':
				var temps = this.getClass(str.substring(1), this.elements[i]);
				for (var j = 0; j < temps.length; j++) {
					if(limit>0&&j==limit)break;//取到limit个即跳出
					childElements.push(temps[j]);
				}
				break;
			default:
				var temps = this.getTagName(str, this.elements[i]);
				for (var j = 0; j < temps.length; j++) {
					if(limit>0&&j==limit)break;//取到limit个即跳出
					childElements.push(temps[j]);
				}
		}
	}
	this.elements = childElements;
	return this;
}

//设置CSS
DomBiz.prototype.css = function(attr, value) {
	for (var i = 0; i < this.elements.length; i++) {
		var ele=this.elements[i];
		if (typeof attr=="object") {
			//传来的是json
			for (var key in attr) {
				ele.style[key] = attr[key];
			}
		}else{
			//传来的是key-value
			ele.style[attr] = value;
		}
	}
	return this;
}

//添加Class
DomBiz.prototype.addClass = function(className) {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].classList.add(className)
	}
	return this;
}

//移除Class
DomBiz.prototype.removeClass = function(className) {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].classList.remove(className)
	}
	return this;
}

//设置,获取innerHTML
DomBiz.prototype.html = function(str) {
	//无参,则是获取内容
	if (arguments.length == 0) {
		if (this.elements.length>0) {
			return this.elements[0].innerHTML;;
		} else{
			return "";
		}
	}
	//有参,则是设置内容
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].innerHTML = str;
	}
	return this;
}

//设置,获取value
DomBiz.prototype.val = function(str) {
	//无参,则是获取内容
	if (arguments.length == 0) {
		if (this.elements.length>0) {
			return this.elements[0].value;
		} else{
			return "";
		}
	}
	//有参,则是设置内容
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].value = str;
	}
	return this;
}

//遍历
DomBiz.prototype.each = function(callback) {
	for (var i = 0; i < this.elements.length; i++) {
		callback&&callback(i,this.elements[i])
	}
	return this;
}

//设置,获取attr
DomBiz.prototype.attr = function(key,value) {
	//只有key,则是取属性逻辑
	if (arguments.length == 1) {
		if (this.elements.length>0) {
			return this.elements[0].getAttribute(key);
		} else{
			return null;
		}
	}
	//有key和value,则是设置属性逻辑
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].setAttribute(key,value);
	}
	return this;
}

//设置显示
DomBiz.prototype.show = function(isInlineBlock) {
	for (var i = 0; i < this.elements.length; i++) {
		if (isInlineBlock==true) {
			this.elements[i].style.display = 'inline-block';
		} else{
			this.elements[i].style.display = 'block';
		}
	}
	return this;
};

//设置隐藏
DomBiz.prototype.hide = function() {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style.display = 'none';
	}
	return this;
};

//加载图片,避免直接给img设置src,图片加载失败显示异常图
DomBiz.prototype.loadimg = function(src) {
	if (!src) return;
	for (var i = 0; i < this.elements.length; i++) {
		var imgDom=this.elements[i];
		var temp = new Image();
		temp.onload = function() {
			imgDom.src = temp.src
		};
		temp.src = src;
	}
	return this;
};

//点击事件
DomBiz.prototype.click = function(fn) {
	for (var i = 0; i < this.elements.length; i++) {
		var ele=this.elements[i];
		if(ele) ele.addEventListener("tap",fn);
	}
	return this;
};

/*打开新窗口
 *param 参数json格式 {key:value}
 *接收参数: var self = plus.webview.currentWebview(); var value=self.key;
 * */
DomBiz.prototype.href = function(url,title, param) {
	this.click(function() {
		openWindow(url,title,param);
	})
	return this;
};