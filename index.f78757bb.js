!function(){var t;function e(t){if(this.size=0|t,this.size<=1||0!=(this.size&this.size-1))throw new Error("FFT size must be a power of two and bigger than 1");this._csize=t<<1;for(var e=new Array(2*this.size),r=0;r<e.length;r+=2){const t=Math.PI*r/this.size;e[r]=Math.cos(t),e[r+1]=-Math.sin(t)}this.table=e;for(var n=0,o=1;this.size>o;o<<=1)n++;this._width=n%2==0?n-1:n,this._bitrev=new Array(1<<this._width);for(var i=0;i<this._bitrev.length;i++){this._bitrev[i]=0;for(var a=0;a<this._width;a+=2){var s=this._width-a-2;this._bitrev[i]|=(i>>>a&3)<<s}}this._out=null,this._data=null,this._inv=0}function r(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(t)))return;var r=[],n=!0,o=!1,i=void 0;try{for(var a,s=t[Symbol.iterator]();!(n=(a=s.next()).done)&&(r.push(a.value),!e||r.length!==e);n=!0);}catch(t){o=!0,i=t}finally{try{n||null==s.return||s.return()}finally{if(o)throw i}}return r}(t,e)||function(t,e){if(!t)return;if("string"==typeof t)return n(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);"Object"===r&&t.constructor&&(r=t.constructor.name);if("Map"===r||"Set"===r)return Array.from(t);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return n(t,e)}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function n(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}t=e,e.prototype.fromComplexArray=function(t,e){for(var r=e||new Array(t.length>>>1),n=0;n<t.length;n+=2)r[n>>>1]=t[n];return r},e.prototype.createComplexArray=function(){const t=new Array(this._csize);for(var e=0;e<t.length;e++)t[e]=0;return t},e.prototype.toComplexArray=function(t,e){for(var r=e||this.createComplexArray(),n=0;n<r.length;n+=2)r[n]=t[n>>>1],r[n+1]=0;return r},e.prototype.completeSpectrum=function(t){for(var e=this._csize,r=e>>>1,n=2;n<r;n+=2)t[e-n]=t[n],t[e-n+1]=-t[n+1]},e.prototype.transform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._transform4(),this._out=null,this._data=null},e.prototype.realTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._realTransform4(),this._out=null,this._data=null},e.prototype.inverseTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=1,this._transform4();for(var r=0;r<t.length;r++)t[r]/=this.size;this._out=null,this._data=null},e.prototype._transform4=function(){var t,e,r=this._out,n=this._csize,o=1<<this._width,i=n/o<<1,a=this._bitrev;if(4===i)for(t=0,e=0;t<n;t+=i,e++){const r=a[e];this._singleTransform2(t,r,o)}else for(t=0,e=0;t<n;t+=i,e++){const r=a[e];this._singleTransform4(t,r,o)}var s=this._inv?-1:1,h=this.table;for(o>>=2;o>=2;o>>=2){var l=(i=n/o<<1)>>>2;for(t=0;t<n;t+=i)for(var u=t+l,c=t,f=0;c<u;c+=2,f+=o){const t=c,e=t+l,n=e+l,o=n+l,i=r[t],a=r[t+1],u=r[e],v=r[e+1],m=r[n],p=r[n+1],d=r[o],g=r[o+1],y=i,_=a,b=h[f],w=s*h[f+1],x=u*b-v*w,A=u*w+v*b,k=h[2*f],T=s*h[2*f+1],M=m*k-p*T,I=m*T+p*k,z=h[3*f],P=s*h[3*f+1],S=d*z-g*P,C=d*P+g*z,E=y+M,R=_+I,N=y-M,B=_-I,q=x+S,L=A+C,j=s*(x-S),D=s*(A-C),O=E+q,F=R+L,H=E-q,U=R-L,W=N+D,X=B-j,Y=N-D,$=B+j;r[t]=O,r[t+1]=F,r[e]=W,r[e+1]=X,r[n]=H,r[n+1]=U,r[o]=Y,r[o+1]=$}}},e.prototype._singleTransform2=function(t,e,r){const n=this._out,o=this._data,i=o[e],a=o[e+1],s=o[e+r],h=o[e+r+1],l=i+s,u=a+h,c=i-s,f=a-h;n[t]=l,n[t+1]=u,n[t+2]=c,n[t+3]=f},e.prototype._singleTransform4=function(t,e,r){const n=this._out,o=this._data,i=this._inv?-1:1,a=2*r,s=3*r,h=o[e],l=o[e+1],u=o[e+r],c=o[e+r+1],f=o[e+a],v=o[e+a+1],m=o[e+s],p=o[e+s+1],d=h+f,g=l+v,y=h-f,_=l-v,b=u+m,w=c+p,x=i*(u-m),A=i*(c-p),k=d+b,T=g+w,M=y+A,I=_-x,z=d-b,P=g-w,S=y-A,C=_+x;n[t]=k,n[t+1]=T,n[t+2]=M,n[t+3]=I,n[t+4]=z,n[t+5]=P,n[t+6]=S,n[t+7]=C},e.prototype._realTransform4=function(){var t,e,r=this._out,n=this._csize,o=1<<this._width,i=n/o<<1,a=this._bitrev;if(4===i)for(t=0,e=0;t<n;t+=i,e++){const r=a[e];this._singleRealTransform2(t,r>>>1,o>>>1)}else for(t=0,e=0;t<n;t+=i,e++){const r=a[e];this._singleRealTransform4(t,r>>>1,o>>>1)}var s=this._inv?-1:1,h=this.table;for(o>>=2;o>=2;o>>=2){var l=(i=n/o<<1)>>>1,u=l>>>1,c=u>>>1;for(t=0;t<n;t+=i)for(var f=0,v=0;f<=c;f+=2,v+=o){var m=t+f,p=m+u,d=p+u,g=d+u,y=r[m],_=r[m+1],b=r[p],w=r[p+1],x=r[d],A=r[d+1],k=r[g],T=r[g+1],M=y,I=_,z=h[v],P=s*h[v+1],S=b*z-w*P,C=b*P+w*z,E=h[2*v],R=s*h[2*v+1],N=x*E-A*R,B=x*R+A*E,q=h[3*v],L=s*h[3*v+1],j=k*q-T*L,D=k*L+T*q,O=M+N,F=I+B,H=M-N,U=I-B,W=S+j,X=C+D,Y=s*(S-j),$=s*(C-D),G=O+W,J=F+X,K=H+$,Q=U-Y;if(r[m]=G,r[m+1]=J,r[p]=K,r[p+1]=Q,0!==f){if(f!==c){var V=H+-s*$,Z=-U+-s*Y,tt=O+-s*W,et=-F- -s*X,rt=t+u-f,nt=t+l-f;r[rt]=V,r[rt+1]=Z,r[nt]=tt,r[nt+1]=et}}else{var ot=O-W,it=F-X;r[d]=ot,r[d+1]=it}}}},e.prototype._singleRealTransform2=function(t,e,r){const n=this._out,o=this._data,i=o[e],a=o[e+r],s=i+a,h=i-a;n[t]=s,n[t+1]=0,n[t+2]=h,n[t+3]=0},e.prototype._singleRealTransform4=function(t,e,r){const n=this._out,o=this._data,i=this._inv?-1:1,a=2*r,s=3*r,h=o[e],l=o[e+r],u=o[e+a],c=o[e+s],f=h+u,v=h-u,m=l+c,p=i*(l-c),d=f+m,g=v,y=-p,_=f-m,b=v,w=p;n[t]=d,n[t+1]=0,n[t+2]=g,n[t+3]=y,n[t+4]=_,n[t+5]=0,n[t+6]=b,n[t+7]=w};var o,i=document.getElementById("canvas"),a=i.getContext("2d"),s=new Array,h=0,l=new Path2D,u=4096,c=(o=t)&&o.__esModule?o.default:o,f=new c(u),v=f.createComplexArray(),m=f.createComplexArray(),p=new Array,d=new Array,g=0,y=0,_=!1,b=!1,w=document.getElementById("parameter-slider");w.oninput=function(){g=w.valueAsNumber,C()};var x=document.getElementById("complexity-number");x.oninput=function(){y=x.valueAsNumber,C()};var A,k=document.getElementById("complexity-circles-check");function T(){i.width=window.devicePixelRatio*i.clientWidth,i.height=window.devicePixelRatio*i.clientHeight}function M(t,e){return Math.sqrt(t*t+e*e)}function I(t,e,r){return t+(e-t)*r}function z(t,e){var r=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(0===s.length)s.push({x:t,y:e,segmentLength:0});else{var n=s[Math.max(0,s.length-2)],o=M(t-n.x,e-n.y);h+=o;var i={x:t,y:e,segmentLength:o};s.splice(s.length-1,0,i);var a=s[s.length-1];a.segmentLength=M(a.x-t,a.y-e)}l.lineTo(t,e),h>0?(P(),f.transform(m,v),S()):p.splice(0,p.length),r&&C()}function P(){for(var t=s[s.length-1],e=h+t.segmentLength,r=0,n=t,o=0,i=0;i<s.length;i++){var a=s[i];r+=a.segmentLength;for(var l=Math.round(u*r/e),c=l-o+1,f=o;f<l;f++){var m=(f-o)/c;v[2*f]=I(n.x,a.x,m),v[2*f+1]=I(n.y,a.y,m)}n=a,o=l}}function S(){p.splice(0,p.length);for(var t=0;t<u;t++){var e=m[2*t],r=m[2*t+1];p.push({frequency:t<u/2?t:t-u,magnitude:M(e,r)/u,phase:Math.atan2(r,e)})}p.sort((function(t,e){return e.magnitude-t.magnitude}))}function C(){a.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0),a.clearRect(0,0,i.clientWidth,i.clientHeight);var t=new Path2D(l);if(t.closePath(),a.strokeStyle="black",a.stroke(t),p.length>0){var e=Math.min(p.length,y<=0?p.length:y+1),r=2*Math.PI,n=g*r/u,o=0,s=0;if(_){a.beginPath();for(var h=0;h<e;h++){var c=p[h],f=n*c.frequency+c.phase,v=o+c.magnitude*Math.cos(f),m=s+c.magnitude*Math.sin(f);if(h>=1){var b=Math.sqrt(Math.pow(v-o,2)+Math.pow(m-s,2));a.moveTo(o,s),a.arc(o,s,b,0,r)}else d.splice(0,d.length);d.push({x:v,y:m}),o=v,s=m}a.strokeStyle="burlywood",a.stroke(),a.beginPath(),a.moveTo(d[0].x,d[0].y);for(var w=1;w<d.length;w++)a.lineTo(d[w].x,d[w].y);a.strokeStyle="red",a.stroke(),d.splice(0,d.length)}else a.beginPath(),function(t,e){for(var r=0,n=0,o=0;o<t;o++){var i=p[o],s=e*i.frequency+i.phase;r+=i.magnitude*Math.cos(s),n+=i.magnitude*Math.sin(s),a.lineTo(r,n)}}(e,n),a.strokeStyle="red",a.stroke();if(y>0){a.beginPath();for(var x=0;x<u;x++)A(e,x*r/u);A(e,0),a.strokeStyle="green",a.stroke()}}function A(t,e){for(var r=0,n=0,o=0;o<t;o++){var i=p[o],s=e*i.frequency+i.phase;r+=i.magnitude*Math.cos(s),n+=i.magnitude*Math.sin(s)}a.lineTo(r,n)}}k.oninput=function(){_=k.checked,C()},window.addEventListener("resize",(function(){T(),C()})),T(),null===(A=window.location.search)||void 0===A||A.substr(1).split("&").forEach((function(t){switch(t){case"circles":k.checked=!0;break;default:var e=r(t.split("="),2),n=e[0],o=e[1];if(null!==o){var i=o&&decodeURIComponent(o);switch(n){case"pt":var a=r(i.split(";"),2),s=a[0],h=a[1];null!==s&&null!==h&&z(Number(s),Number(h),!1);break;case"range":w.value=i;break;case"circles":k.checked=Boolean(Number(i));break;case"complexity":x.value=i;break;case"fftsize":u=Number(i),f=new c(u),v=f.createComplexArray(),m=f.createComplexArray()}}}})),w.max=(u-1).toString(),g=w.valueAsNumber,x.max=(u-1).toString(),y=x.valueAsNumber,_=k.checked,C(),i.onpointerdown=function(t){0===t.button&&(b=!0,i.setPointerCapture(t.pointerId),z(t.offsetX,t.offsetY))},i.ontouchstart=i.ontouchmove=function(t){1===t.touches.length&&t.preventDefault()},i.onpointermove=function(t){b&&z(t.offsetX,t.offsetY)},i.onpointerup=function(t){b&&(b=!1,i.releasePointerCapture(t.pointerId))},document.getElementById("clear-button").onclick=function(){s.splice(0,s.length),h=0,l=new Path2D,p.splice(0,p.length),C()},document.getElementById("save-button").onclick=function(){var t="";if(s.length>0)for(var e=-1;e<s.length-1;e++){var r=s[(e+s.length)%s.length];t+="&pt=".concat(r.x,";").concat(r.y)}var n=window.location.pathname+"?range="+g+"&complexity="+y+"&circles="+Number(_)+t;history.pushState(null,"",n)}}();
//# sourceMappingURL=index.f78757bb.js.map