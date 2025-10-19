{
	let _turnCount = 0;
	let style = document.createElement('style');
	
	style.innerHTML = `
*[data-visual-hidden] {
	visibility: hidden;
}`;
	document.head.appendChild(style);

	fanstatic.registerCommand('viewport-enter-animate', function(fanstatic, elem) {
		let animation = elem.dataset.visualAnimation;
		let turn = 0;

		if (animation) {
			fanstatic.visual.onEnterViewport(elem, function(){
				_turnCount++;
				
				let animate = function(){
					let classes = [
						'animate__animated',
						'animate__' + animation,
					];
					
					_turnCount--;

					elem.classList.add(...classes);
					elem.removeAttribute('data-visual-hidden');
					elem.removeAttribute('data-visual-animation');
				};
				
				if (fanstatic.visual.settings.turn_delay > 0) {
					window.setTimeout(animate, (_turnCount - 1) * fanstatic.visual.settings.turn_delay);
				}
				else {
					animate();
				}
			})
		}
		else {
			console.error('data-visual-animation attribute not found')
		}
	})
	
	fanstatic.visual = {
		settings: {
			turn_delay: 100,
			log_render: false,
		},
		isOnScreen: function(elem, allowElemBehind = false, allowElemAhead = false) {
			const scrollDist = document.documentElement.scrollTop;
			const elemOffset = window.scrollY + elem.getBoundingClientRect().top; 

			if (!allowElemBehind && !(elemOffset + elem.offsetHeight > scrollDist))
				return false;

			if (!allowElemAhead && !(scrollDist + window.innerHeight > elemOffset))
				return false;

			return true;
		},
		onEnterViewport: function(elem, handler, runOnce = true) {
			let me = this
			if (this.isOnScreen(elem)) {
				if (this.settings.log_render) console.log('[Visual]', 'already in viewport', elem)
				handler()
				return;
			}

			let evh = function() {
				if (me.isOnScreen(elem)) {
					if (me.settings.log_render) console.log('[Visual]', 'entering viewport', elem)
					handler()

					if (runOnce) window.removeEventListener('scroll', evh)
				}
			}

			window.addEventListener('scroll', evh)
		},
	}
	
	window.dispatchEvent(new CustomEvent('fanstatic.visual.load', {
		detail: fanstatic.visual
	}));
}
