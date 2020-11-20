!function(){var t;function e(t){if(this.size=0|t,this.size<=1||0!=(this.size&this.size-1))throw new Error("FFT size must be a power of two and bigger than 1");this._csize=t<<1;for(var e=new Array(2*this.size),n=0;n<e.length;n+=2){const t=Math.PI*n/this.size;e[n]=Math.cos(t),e[n+1]=-Math.sin(t)}this.table=e;for(var r=0,i=1;this.size>i;i<<=1)r++;this._width=r%2==0?r-1:r,this._bitrev=new Array(1<<this._width);for(var o=0;o<this._bitrev.length;o++){this._bitrev[o]=0;for(var s=0;s<this._width;s+=2){var a=this._width-s-2;this._bitrev[o]|=(o>>>s&3)<<a}}this._out=null,this._data=null,this._inv=0}t=e,e.prototype.fromComplexArray=function(t,e){for(var n=e||new Array(t.length>>>1),r=0;r<t.length;r+=2)n[r>>>1]=t[r];return n},e.prototype.createComplexArray=function(){const t=new Array(this._csize);for(var e=0;e<t.length;e++)t[e]=0;return t},e.prototype.toComplexArray=function(t,e){for(var n=e||this.createComplexArray(),r=0;r<n.length;r+=2)n[r]=t[r>>>1],n[r+1]=0;return n},e.prototype.completeSpectrum=function(t){for(var e=this._csize,n=e>>>1,r=2;r<n;r+=2)t[e-r]=t[r],t[e-r+1]=-t[r+1]},e.prototype.transform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._transform4(),this._out=null,this._data=null},e.prototype.realTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._realTransform4(),this._out=null,this._data=null},e.prototype.inverseTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=1,this._transform4();for(var n=0;n<t.length;n++)t[n]/=this.size;this._out=null,this._data=null},e.prototype._transform4=function(){var t,e,n=this._out,r=this._csize,i=1<<this._width,o=r/i<<1,s=this._bitrev;if(4===o)for(t=0,e=0;t<r;t+=o,e++){const n=s[e];this._singleTransform2(t,n,i)}else for(t=0,e=0;t<r;t+=o,e++){const n=s[e];this._singleTransform4(t,n,i)}var a=this._inv?-1:1,h=this.table;for(i>>=2;i>=2;i>>=2){var u=(o=r/i<<1)>>>2;for(t=0;t<r;t+=o)for(var f=t+u,l=t,c=0;l<f;l+=2,c+=i){const t=l,e=t+u,r=e+u,i=r+u,o=n[t],s=n[t+1],f=n[e],v=n[e+1],p=n[r],d=n[r+1],g=n[i],m=n[i+1],_=o,y=s,w=h[c],b=a*h[c+1],x=f*w-v*b,T=f*b+v*w,M=h[2*c],A=a*h[2*c+1],P=p*M-d*A,k=p*A+d*M,z=h[3*c],I=a*h[3*c+1],E=g*z-m*I,C=g*I+m*z,R=_+P,S=y+k,L=_-P,q=y-k,B=x+E,D=T+C,N=a*(x-E),X=a*(T-C),Y=R+B,F=S+D,H=R-B,W=S-D,j=L+X,G=q-N,J=L-X,K=q+N;n[t]=Y,n[t+1]=F,n[e]=j,n[e+1]=G,n[r]=H,n[r+1]=W,n[i]=J,n[i+1]=K}}},e.prototype._singleTransform2=function(t,e,n){const r=this._out,i=this._data,o=i[e],s=i[e+1],a=i[e+n],h=i[e+n+1],u=o+a,f=s+h,l=o-a,c=s-h;r[t]=u,r[t+1]=f,r[t+2]=l,r[t+3]=c},e.prototype._singleTransform4=function(t,e,n){const r=this._out,i=this._data,o=this._inv?-1:1,s=2*n,a=3*n,h=i[e],u=i[e+1],f=i[e+n],l=i[e+n+1],c=i[e+s],v=i[e+s+1],p=i[e+a],d=i[e+a+1],g=h+c,m=u+v,_=h-c,y=u-v,w=f+p,b=l+d,x=o*(f-p),T=o*(l-d),M=g+w,A=m+b,P=_+T,k=y-x,z=g-w,I=m-b,E=_-T,C=y+x;r[t]=M,r[t+1]=A,r[t+2]=P,r[t+3]=k,r[t+4]=z,r[t+5]=I,r[t+6]=E,r[t+7]=C},e.prototype._realTransform4=function(){var t,e,n=this._out,r=this._csize,i=1<<this._width,o=r/i<<1,s=this._bitrev;if(4===o)for(t=0,e=0;t<r;t+=o,e++){const n=s[e];this._singleRealTransform2(t,n>>>1,i>>>1)}else for(t=0,e=0;t<r;t+=o,e++){const n=s[e];this._singleRealTransform4(t,n>>>1,i>>>1)}var a=this._inv?-1:1,h=this.table;for(i>>=2;i>=2;i>>=2){var u=(o=r/i<<1)>>>1,f=u>>>1,l=f>>>1;for(t=0;t<r;t+=o)for(var c=0,v=0;c<=l;c+=2,v+=i){var p=t+c,d=p+f,g=d+f,m=g+f,_=n[p],y=n[p+1],w=n[d],b=n[d+1],x=n[g],T=n[g+1],M=n[m],A=n[m+1],P=_,k=y,z=h[v],I=a*h[v+1],E=w*z-b*I,C=w*I+b*z,R=h[2*v],S=a*h[2*v+1],L=x*R-T*S,q=x*S+T*R,B=h[3*v],D=a*h[3*v+1],N=M*B-A*D,X=M*D+A*B,Y=P+L,F=k+q,H=P-L,W=k-q,j=E+N,G=C+X,J=a*(E-N),K=a*(C-X),O=Y+j,Q=F+G,U=H+K,V=W-J;if(n[p]=O,n[p+1]=Q,n[d]=U,n[d+1]=V,0!==c){if(c!==l){var Z=H+-a*K,$=-W+-a*J,tt=Y+-a*j,et=-F- -a*G,nt=t+f-c,rt=t+u-c;n[nt]=Z,n[nt+1]=$,n[rt]=tt,n[rt+1]=et}}else{var it=Y-j,ot=F-G;n[g]=it,n[g+1]=ot}}}},e.prototype._singleRealTransform2=function(t,e,n){const r=this._out,i=this._data,o=i[e],s=i[e+n],a=o+s,h=o-s;r[t]=a,r[t+1]=0,r[t+2]=h,r[t+3]=0},e.prototype._singleRealTransform4=function(t,e,n){const r=this._out,i=this._data,o=this._inv?-1:1,s=2*n,a=3*n,h=i[e],u=i[e+n],f=i[e+s],l=i[e+a],c=h+f,v=h-f,p=u+l,d=o*(u-l),g=c+p,m=v,_=-d,y=c-p,w=v,b=d;r[t]=g,r[t+1]=0,r[t+2]=m,r[t+3]=_,r[t+4]=y,r[t+5]=0,r[t+6]=w,r[t+7]=b};var n,r=document.getElementById("canvas"),i=r.getContext("2d"),o=new Array,s=0,a=new Path2D,h=4096,u=new((n=t)&&n.__esModule?n.default:n)(h),f=u.createComplexArray(),l=u.createComplexArray(),c=new Array,v=new Array,p=0,d=0,g=!1,m=!1;function _(){r.width=window.devicePixelRatio*r.clientWidth,r.height=window.devicePixelRatio*r.clientHeight}window.addEventListener("resize",(function(){_(),A()})),_(),r.onpointerdown=function(t){0===t.button&&(m=!0,r.setPointerCapture(t.pointerId),M(t.offsetX,t.offsetY))},r.ontouchstart=r.ontouchmove=function(t){1===t.touches.length&&(M(t.changedTouches[0].clientX-r.offsetLeft,t.changedTouches[0].clientY-r.offsetTop),t.preventDefault())},r.onpointermove=function(t){m&&M(t.offsetX,t.offsetY)},r.onpointerup=function(t){m&&(m=!1,r.releasePointerCapture(t.pointerId))},document.getElementById("clear-button").onclick=function(){o.splice(0,o.length),s=0,a=new Path2D,c.splice(0,c.length),A()};var y=document.getElementById("parameter-slider");y.max=4095..toString(),p=y.valueAsNumber,y.oninput=function(){p=y.valueAsNumber,A()};var w=document.getElementById("complexity-number");w.max=4095..toString(),d=w.valueAsNumber,w.oninput=function(){d=w.valueAsNumber,A()};var b=document.getElementById("complexity-circles-check");function x(t,e){return Math.sqrt(t*t+e*e)}function T(t,e,n){return t+(e-t)*n}function M(t,e){if(0===o.length)o.push({x:t,y:e,segmentLength:0});else{var n=o[Math.max(0,o.length-2)],r=x(t-n.x,e-n.y);s+=r;var i={x:t,y:e,segmentLength:r};o.splice(o.length-1,0,i);var v=o[o.length-1];v.segmentLength=x(v.x-t,v.y-e)}a.lineTo(t,e),s>0?(function(){for(var t=o[o.length-1],e=s+t.segmentLength,n=0,r=t,i=0,a=0;a<o.length;a++){var u=o[a];n+=u.segmentLength;for(var l=Math.round(h*n/e),c=l-i+1,v=i;v<l;v++){var p=(v-i)/c;f[2*v]=T(r.x,u.x,p),f[2*v+1]=T(r.y,u.y,p)}r=u,i=l}}(),u.transform(l,f),function(){c.splice(0,c.length);for(var t=0;t<h;t++){var e=l[2*t],n=l[2*t+1];c.push({frequency:t<2048?t:t-h,magnitude:x(e,n)/h,phase:Math.atan2(n,e)})}c.sort((function(t,e){return e.magnitude-t.magnitude}))}()):c.splice(0,c.length),A()}function A(){i.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0),i.clearRect(0,0,r.clientWidth,r.clientHeight);var t=new Path2D(a);if(t.closePath(),i.strokeStyle="black",i.stroke(t),c.length>0){var e=0,n=0,o=Math.min(c.length,d<=0?c.length:d+1),s=2*Math.PI,u=p*s/h;if(g){var f,l,m;i.beginPath();for(var _=0;_<o;_++){var y=c[_],w=u*y.frequency+y.phase;f=e+y.magnitude*Math.cos(w),l=n+y.magnitude*Math.sin(w),_>=1?(m=Math.sqrt(Math.pow(f-e,2)+Math.pow(l-n,2)),i.moveTo(e,n),i.arc(e,n,m,0,s)):v.splice(0,v.length),v.push({x:f,y:l}),e=f,n=l}i.strokeStyle="burlywood",i.stroke(),i.beginPath(),i.moveTo(v[0].x,v[0].y);for(var b=1;b<v.length;b++)i.lineTo(v[b].x,v[b].y);i.strokeStyle="red",i.stroke(),v.splice(0,v.length)}else i.beginPath(),function(t,e){for(var n=0,r=0,o=0;o<t;o++){var s=c[o],a=e*s.frequency+s.phase;n+=s.magnitude*Math.cos(a),r+=s.magnitude*Math.sin(a),i.lineTo(n,r)}}(o,u),i.strokeStyle="red",i.stroke();if(d>0){i.beginPath();for(var x=0;x<h;x++)T(o,x*s/h);T(o,0),i.strokeStyle="green",i.stroke()}}function T(t,e){for(var n=0,r=0,o=0;o<t;o++){var s=c[o],a=e*s.frequency+s.phase;n+=s.magnitude*Math.cos(a),r+=s.magnitude*Math.sin(a)}i.lineTo(n,r)}}g=b.checked,b.oninput=function(){g=b.checked,A()}}();
//# sourceMappingURL=index.d6143ad1.js.map