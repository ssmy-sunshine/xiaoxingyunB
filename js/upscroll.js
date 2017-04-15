/*
 *上拉加载对象
 * 
1.检查img目录下是否有list_header_info.png,list_nomore_info.png,list_progress_circle.png这3张图,并搜索检查在upscroll.js中的路径是否正确

2.引用upscroll.css和upscroll.js

3.拷贝一下布局结构到html
<div id="upscroll" class="upscroll">//因为upscroll的height: 100%,所以父布局要有高度或直接固定upscroll的高度,否则无法触发上拉加载.
	//这里也可以写内容的
	<div class="upscroll-content">
		//这里也可以写内容的
		<ul class="upscroll-list">
			//分页加载的列表
		</ul>
	</div>
</div>

4.创建UpScroll对象: var upScroll=new UpScroll("upscroll",getData);
function getData(pg) {
	var param={自行拼接联网参数pg.no, pg.size, pg.firstTime};
	ajaxData(url, function(dataArr) {
		try{
			var data=JSON.parse(dataArr[2]);
			var systime=dataArr[dataArr.length-1];
			//必须先隐藏上拉加载的状态
			var isEmpty=upScroll.endSuccess(data.length,systime);
			if (isEmpty) {
				new EmptyBox().show(upScroll.upscrollList);
			}else{
				//再设置数据
				setData(data,systime);
			}
						
		}catch(e){
			upScroll.endErr();//解析异常,隐藏上拉加载的状态
		}
	}, param ,function() {
		upScroll.endErr();//联网异常,隐藏上拉加载的状态
	},true);//无需进度条
}

5.setData(data)可以这么写
function setData(data){
	var listDom=upScroll.upscrollList;
	for (var i = 0; i < data.length; i++) {
		var liData=data[i];
		//拼接
		var list='';
		list+='';
		//加入
		var liDom=document.createElement("li");
		liDom.innerHTML=list;
		listDom.appendChild(liDom);
		//存入变量到li
		liDom.setAttribute("liID",liData.id);
		//li的点击事件
		liDom.addEventListener("tap",function() {
			var liID=this.getAttribute("liID");
			
		})
	}
}
**/
function UpScroll (upscrollId,callback,size,offset,isAuto) {
	this.upscroll=document.getElementById(upscrollId);
	this.upscrollContent=this.upscroll.getElementsByClassName("upscroll-content")[0];
	this.upscrollList=this.upscroll.getElementsByClassName("upscroll-list")[0];
	this.callback=callback;//上拉加载完成的回调
	this.offset=offset||200;//离底部的距离
	this.isLoading=false;//是否在加载中
	this.param={
		no:0,//当前页(1开始)
		size:size||8,//每页数据条数
		firstTime:""//第一页数据的时间,加载更多页的时候需传过去,防止后台加入新数据导致新加载的页重复;(加载第一页不需要传)
	}
	//注册滚动事件
	this.onScroll();
	//自动加载第一页
	if(isAuto!=false) this.trigger();
}

/*触发上拉加载*/
UpScroll.prototype.trigger=function () {
	this.isLoading=true;
	//显示加载中...
	this.showLoading();
	//执行回调
	this.param.no++;
	this.callback&&this.callback(this.param)
}

/*恢复设置,重新加载,用于界面切换时清空列表重新第一页加载*/
UpScroll.prototype.reset=function () {
	this.param.no=0;
	this.param.firstTime="";
	this.onRefresh(false,false);//隐藏加载中的布局
	if(this.upscrollList) this.upscrollList.innerHTML="";//制空列表
	this.trigger();//重新加载
}


/*联网成功的回调:隐藏下拉刷新,无数据,恢复上拉
 *dataSize 联网获取到的数据条数
 *systime 第一页的系统时间
 *@return 如果第一页无任何数据则返回true;可用于提示用户列表无任何数据,比如new EmptyBox().show();
 */
UpScroll.prototype.endSuccess=function(dataSize,systime) {
	if (this.param.no==1) {
		if(systime) this.param.firstTime=systime;//重置第一页的时间
		if(dataSize>=this.param.size){
			this.resetScroll();//如果第一页是满的,恢复上拉加载
			this.onRefresh(false,false);//第一页有数据
		}else{
			this.onRefresh(true,false);//第一页已无数据,不显示上拉无数据的提示
		}
		if(this.upscrollList) this.upscrollList.innerHTML="";//第一页需制空再加入
		//第一页无任何数据
		if(dataSize==0) return true;
		//隐藏顶部按钮
		this.hideTopBtn();
	}else{
		this.showTopBtn();//显示顶部按钮
		this.onRefresh(dataSize<this.param.size,true);//第二页开始,会显示上拉无数据的提示
	}
	return false;//不是第一页无任何数据
}

/*联网失败的回调:隐藏下拉刷新*/
UpScroll.prototype.endErr=function() {
	this.param.no--;//上拉加载失败需退回执行时加的1
	if (this.param.no<1) this.param.no=1;
	this.onRefresh(false,false);
}

/*开启滚动监听*/
UpScroll.prototype.onScroll=function () {
	var self=this;
	self.scrollFun=function() {
	    var diff=self.upscrollContent.offsetHeight+self.upscrollContent.offsetTop-self.upscroll.offsetHeight-self.upscroll.scrollTop;
//		console.log("self.upscrollContent.offsetHeight="+self.upscrollContent.offsetHeight+",self.upscrollContent.offsetTop="+self.upscrollContent.offsetTop+",self.upscroll.offsetHeight="+self.upscroll.offsetHeight+",self.upscroll.scrollTop="+self.upscroll.scrollTop);
//		console.log("diff="+diff+",self.offset="+self.offset+","+(diff<=self.offset));
	    if(self.upscrollContent.offsetHeight&&diff<=self.offset){
	    	//滚动到底部了,如果没有在加载中,则显示加载布局,并执行回调
	    	if (!self.isLoading) {
	    		self.trigger()
	    	}
	    }
	}
	self.upscroll.addEventListener("scroll",self.scrollFun);
}

/*回调执行完成后,需调用的方法
 *isShowNoData 是否显示无数据的提示
 */
UpScroll.prototype.onRefresh=function (isNoData,isShowNoData) {
	if (isNoData) {
		this.offScroll();//注销滚动事件
		this.showNoData(isShowNoData);//显示没有数据的布局
	}else{
		this.hideLoading();//隐藏加载中的布局
	}
	this.isLoading=false;//标记不在加载中
}

/*显示加载中的布局*/
UpScroll.prototype.showLoading=function () {
	var footer=this.upscroll.getElementsByClassName("upscroll-footer")[0];
	if(!footer){
		footer=document.createElement("div");
		footer.className="upscroll-footer";
		footer.innerHTML='<img class="upscroll-progress" src="../img/list_progress_circle.png"/><img class="upscroll-load-stutas" src="../img/list_header_info.png"/>';
		//使用parentNode保证footer与upscroll-content并列
		this.upscrollContent.parentNode.appendChild(footer);
	}else{
		footer.style.visibility="visible";
		var progress=footer.getElementsByClassName("upscroll-progress")[0];
		progress.style.visibility="visible";
		var stutas=footer.getElementsByClassName("upscroll-load-stutas")[0];
		stutas.setAttribute("src","../img/list_header_info.png");
		stutas.style.visibility="visible";
	}
}

/*隐藏加载中的布局*/
UpScroll.prototype.hideLoading=function () {
	var footer=this.upscroll.getElementsByClassName("upscroll-footer")[0];
	if(footer){
		footer.style.visibility="hidden";
		var progress=footer.getElementsByClassName("upscroll-progress")[0];
		progress.style.visibility="hidden";
		var stutas=footer.getElementsByClassName("upscroll-load-stutas")[0];
		stutas.style.visibility="hidden";
	}
}

/*显示没有数据的布局*/
UpScroll.prototype.showNoData=function (isShowNoData) {
	var footer=this.upscroll.getElementsByClassName("upscroll-footer")[0];
	if(footer){
		var progress=footer.getElementsByClassName("upscroll-progress")[0];
		progress.style.visibility="hidden";
		var stutas=footer.getElementsByClassName("upscroll-load-stutas")[0];
		if(isShowNoData==false){
			stutas.style.visibility="hidden";
		}else{
			stutas.setAttribute("src","../img/list_nomore_info.png");
			stutas.style.visibility="visible";
		}
	}
}

/*注销滚动事件*/
UpScroll.prototype.offScroll=function () {
	this.upscroll.removeEventListener("scroll",this.scrollFun);
}

/*恢复滚动事件*/
UpScroll.prototype.resetScroll=function () {
	if (this.scrollFun) {
		this.upscroll.removeEventListener("scroll",this.scrollFun);
		this.upscroll.addEventListener("scroll",this.scrollFun);
	}
}

/*主动触发上拉列表的滑动事件;如遇到列表初始化无法滑动,可在endSuccess之后调用本方法解决*/
UpScroll.prototype.dispatchScroll=function () {
	this.upscroll.dispatchEvent(new CustomEvent("scroll", {
		detail: null,
		bubbles: true,
		cancelable: true
	}));
}

/*显示回到顶部的按钮*/
UpScroll.prototype.showTopBtn=function(){
	var self=this;
	var totopCls=document.getElementsByClassName("upscroll-totop");
	//未加入按钮,则加入
	if (totopCls.length==0) {
		var toTopBtn = document.createElement("div");
		toTopBtn.className="iconfont icon-dingbu upscroll-totop";
		document.body.appendChild(toTopBtn);
		toTopBtn.onclick=function(){
			self.upscroll.scrollTop = 0;//置顶
		}
	}else{
		//则显示
		totopCls[0].style.visibility="visible";
	}
}

/*隐藏回到顶部的按钮*/
UpScroll.prototype.hideTopBtn=function(){
	var totopCls=document.getElementsByClassName("upscroll-totop");
	if (totopCls.length>0) {
		totopCls[0].style.visibility="hidden";
	}
}