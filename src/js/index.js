(function ($, player) {
	function MusicPlayer(dom) {
		this.wrap = dom;	//播放器的容器
		this.dataList = [];	//存储请求到的数据

		//this.now = 0;	//歌曲的索引
		this.indexObj=null;	//索引值对象（用于切歌）
		this.rotateTimer = null;	//旋转唱片的定时器
		this.curIndex=0;	//当前播放歌曲的索引值
		this.list=null;	//列表切歌对象（在listPlay里赋了值）
		this.proControl = null; // 进度条控制对象
	}
	MusicPlayer.prototype = {
		init:function() {	//初始化
			this.getDom();	//获取元素
			this.getData('../mock/data.json');	//请求数据
		},
		getDom:function() {	//获取页面里的元素
			this.record = document.querySelector('.songImg img');	//旋转图片
			this.controlBtns = document.querySelectorAll('.control li');	//底部导航里的按钮
		},
		getData:function(url) {
			var This = this;

			$.ajax({
				url: url,
				method: 'get',
				success: function (data) {
					This.dataList = data;	//存储请求过来的数据

					This.listPlay();	//列表切歌

					This.indexObj=new player.controlIndex(data.length);	//给索引值对象赋值

					This.loadMusic(This.indexObj.index);	//加载音乐
					player.music.end(This.musicEnd.bind(This));
					This.musicControl();	//添加音乐操作功能
					This.moveProgress(); 	// 添加进度条移动功能
				},
				error: function () {
					console.log('数据请求失败');
				}
			});
		},
		loadMusic:function(index) {	//加载音乐
			player.render(this.dataList[index]);	//渲染图片，歌曲信息、进度条
			player.music.load(this.dataList[index].audioSrc);
			
			//播放音乐（只有音乐的状态为play的时候才能播放）
			if (player.music.status == 'play') {
				console.log('play')
				player.music.play();
				this.controlBtns[2].className = 'playing';	//按钮状态变成播放状态
				this.imgRotate(0);	//旋转图片
			}

			//改变列表里歌曲的选中状态
			this.list.changeSelect(index);

			this.curIndex=index;	//存储当前歌曲对应的索引值
		},
		musicEnd:function(){ // 音乐结束换曲
			player.music.status = 'play';
			player.proControl.start(0);
			this.loadMusic(this.indexObj.next());
		},
		musicControl:function() {	//控制音乐（上一首、下一首。。。）
			var This = this;
			//上一首
			this.controlBtns[1].addEventListener('touchend', function () {
				player.music.status = 'play';
				player.proControl.start(0);
				//This.now--;
				//This.loadMusic(--This.now);
				This.loadMusic(This.indexObj.prev());
			});

			//播放、暂停
			this.controlBtns[2].addEventListener('touchend', function () {
				if (player.music.status == 'play') {	//歌曲的状态为播放，点击后要暂停
					player.proControl.stop();
					player.music.pause();	//歌曲暂停
					this.className = '';	//按钮变成暂停状态
					This.imgStop();			//停止旋转图片
				} else {//歌曲的状态为暂停，点击后要播放
					player.proControl.start();
					player.music.play();	//歌曲播放
					this.className = 'playing';	//按钮变成播放状态

					//第二次播放的时候需要加上上一次旋转的角度。但是第一次的时候这个角度是没有的，取不到。所以做了一个容错处理
					var deg=This.record.dataset.rotate || 0;
					This.imgRotate(deg);	//旋转图片
				}
			});


			//下一首
			this.controlBtns[3].addEventListener('touchend', function () {
				player.music.status = 'play';
				player.proControl.start(0);
				//This.now--;
				//This.loadMusic(++This.now);
				This.loadMusic(This.indexObj.next());
			});
		},
		imgRotate:function(deg) {	//旋转唱片
			var This = this;

			clearInterval(this.rotateTimer);

			this.rotateTimer = setInterval(function () {
				deg = +deg + 0.2;	//前面的加号是把字符串转数字

				This.record.style.transform = 'rotate(' + deg + 'deg)';
				This.record.dataset.rotate=deg;	//把旋转的角度存到标签身上，为了暂停后继续播放能取到
			}, 1000 / 60);
		},
		imgStop:function(){	//停止图片旋转
			clearInterval(this.rotateTimer);
		},
		listPlay:function(){	//列表切歌
			var This=this;

			this.list=player.listControl(this.dataList, this.wrap);	//把listControl对象赋值给this.list

			//列表按钮添加点击事件
			this.controlBtns[4].addEventListener('touchend',function(){
				This.list.slideUp();	//让列表显示出来
			});

			//歌曲列表添加事件
			this.list.musicList.forEach(function(item,index){
				item.addEventListener('touchend',function(){
					//如果点击的是当前的那首歌，不管它是播放还是暂停都无效
					if(This.curIndex==index){
						return;
					}

					player.music.status = 'play';	//歌曲要变成播放状态
					This.indexObj.index=index;	//索引值对象身上的当前索引值要更新
					This.loadMusic(index);		//加载点击对应的索引值的那首歌曲
					This.list.slideDown();		//列表消失
				});
			});
		},
		moveProgress:function(){ // 移动进度条
			var offset = $('.pro-bottom').offset();
			var left = offset.left;
			var width = offset.width;
			var This = this;
			$('.spot').on('touchstart', function () {
				player.proControl.stop();
			}).on('touchmove', function (ev) {
				var x = ev.changedTouches[0].clientX;
				var per = (x - left) / width;
				if (per > 0 && per <= 1) {
					player.proControl.upDate(per);
				}
			}).on('touchend', function (ev) {
				var x = ev.changedTouches[0].clientX;
				var per = (x - left) / width;
				if (per > 0 && per < 1) {
					var cutTime = per * This.dataList[This.curIndex].duration;
					player.music.playTo(cutTime);
					player.music.status='play';
		
					player.music.muted = true;
					player.music.play();
		
		
					$('.play').addClass('playing');
					player.proControl.start(per);
				}
			});
		}

	}

	var musicPlayer = new MusicPlayer(document.getElementById('wrap'));
	musicPlayer.init();

})(window.Zepto, window.player);