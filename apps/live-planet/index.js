(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&t(o)}).observe(document,{childList:!0,subtree:!0});function i(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(s){if(s.ep)return;s.ep=!0;const r=i(s);fetch(s.href,r)}})();class ve{constructor(e,i){this.g_variableName=e,this.g_serverURL=i,this.g_prefetchedImages={}}colorRampToByteArray(e){let i=new Uint8Array(e.length*4);for(let t=0;t<e.length;t++){let s=e[t].rgb;e[t].mask;let r=Math.floor(s[3]);e[t].mask||(r=0),i[t*4]=Math.floor(s[0]),i[t*4+1]=Math.floor(s[1]),i[t*4+2]=Math.floor(s[2]),i[t*4+3]=r}return i}rgbaArrayToBase64Png(e,i,t){const s=document.createElement("canvas");s.width=i,s.height=t;const r=s.getContext("2d"),o=new ImageData(new Uint8ClampedArray(e),i,t);return r.putImageData(o,0,0),s.toDataURL("image/png")}loadImage(e){return new Promise((t,s)=>{let r=new Image;r.crossOrigin="anonymous",r.onload=function(){let a=document.createElement("canvas").getContext("webgl2");a.activeTexture(a.TEXTURE0);let n=a.createTexture();a.bindTexture(a.TEXTURE_2D,n);const l=a.createFramebuffer();a.bindFramebuffer(a.FRAMEBUFFER,l),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,n,0),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,this),a.drawBuffers([a.COLOR_ATTACHMENT0]);let h=new Uint8Array(r.width*r.height*4);a.readPixels(0,0,r.width,r.height,a.RGBA,a.UNSIGNED_BYTE,h),a.deleteTexture(n),a.deleteFramebuffer(l);let u=a.getExtension("WEBGL_lose_context");u&&u.loseContext();let c={width:r.width,height:r.height,arrayBufferView:h};t({source:c})},r.onerror=()=>{s(new Error(`Failed to load image: ${e}`))},r.src=e})}async prefetchImage(e){let i=this.loadImage(e);this.g_prefetchedImages[e]=i,await i}toServerURL(e){return`${this.g_serverURL}${e}`}timestampToImageURL(e){try{e=e.replaceAll(" ","-").replaceAll(":","-")}catch(i){console.error(i)}return this.toServerURL(`/timeseries/${e}-${this.g_variableName}.png`)}async prefetchImages(e,i,t){for(let s=0;s<t;s++){let r=1,o=i+r;o>=e.length&&(o=0);let a=e[o],n=this.timestampToImageURL(a);i=i+r,this.g_prefetchedImages[n]===void 0&&this.prefetchImage(n)}}async prefetchAllImages(e){for(let i=0;i<e.length;i++){let t=this.timestampToImageURL(e[i]);t in this.g_prefetchedImages||this.prefetchImage(t)}}setTexture(e,i){new Promise(async(t,s)=>{if(i in this.g_prefetchedImages[i]){let r=await this.g_prefetchedImages[i];e.copyFrom(r),delete this.g_prefetchedImages[i]}else{let r=await this.loadImage(i);e.copyFrom(r)}t(imageData)})}fetchImageData(e){return new Promise(async(i,t)=>{let s=null;e in this.g_prefetchedImages?(s=await this.g_prefetchedImages[e],delete this.g_prefetchedImages[e]):s=await this.loadImage(e),i(s)})}removeCachedImages(e){e.forEach(i=>{i in this.g_prefetchedImages&&delete this.g_prefetchedImages[i]})}clearCache(){this.g_prefetchAllImages={}}}let j=`
uniform sampler2D u_floatTexCurrent;     
uniform sampler2D u_floatTexNext;     
uniform bool u_enableBilinear;
uniform float u_transition;
uniform vec2 u_texSize;          

// the float pressure values are encoded as rgba in this texture
// this function decodes the rgba value and converts it back to a float value
float decodeValue(sampler2D tex, vec2 st)
{
    vec4 c2 = texture(tex, fract(st)); 
    ivec4 bytes = ivec4(c2 * 255.0);
    int intVal = (bytes.a << 24) | (bytes.b << 16) | (bytes.g << 8) | (bytes.r);
    //float value = c2.r * 255. + (c2.g * 255. * 256.) + (c2.b * 255. * 65536.) + (c2.a * 255. * 16777216.); 
    float value = float(intVal) / 10.;  
    return value;        
}

// applies bilinear sampling because filtering is disable on the texture sampler

float bilinearSample(sampler2D tex, vec2 uv, vec2 texSize) 
{                 
    // Calculate the coordinates in texel space
    vec2 texelCoord = uv * texSize;
    // Get the integer and fractional parts of the texture coordinates
    vec2 iCoord = floor(texelCoord);
    vec2 fCoord = fract(texelCoord);

    // Get the normalized texture coordinates for the four neighboring texels
    vec2 uv00 = (iCoord + vec2(0.0, 0.0)) / texSize;
    vec2 uv10 = (iCoord + vec2(1.0, 0.0)) / texSize;
    vec2 uv01 = (iCoord + vec2(0.0, 1.0)) / texSize;
    vec2 uv11 = (iCoord + vec2(1.0, 1.0)) / texSize;

    // Sample the four neighboring texels
    float tex00 = decodeValue(tex, uv00);
    float tex10 = decodeValue(tex, uv10);
    float tex01 = decodeValue(tex, uv01);
    float tex11 = decodeValue(tex, uv11);

    // Interpolate between the texels
    float mixX1 = mix(tex00, tex10, fCoord.x);
    float mixX2 = mix(tex01, tex11, fCoord.x);
    float mixY = mix(mixX1, mixX2, fCoord.y);

    return mixY;
}  

float sampleGridCell(sampler2D tex, vec2 uv, vec2 texSize)
{
    return u_enableBilinear ? bilinearSample(tex, uv, texSize) : decodeValue(tex, uv);
}
`,Ce=`
uniform sampler2D u_bluemarbleTex;
uniform sampler2D u_colorbarTex;
uniform bool u_showBluemarble; 
uniform bool u_showGrid; 
uniform bool u_showContours;
uniform vec4 u_meridianDivisions;
uniform vec4 u_parallelDivisions;        
uniform float u_layerAlpha;    
const float c_gridLineWidthScaling[4] = float[4](0.025,0.025,0.010,0.010);
const vec3 c_gridColors[4] = vec3[4](vec3(0.8, 0.8, 0.8), vec3(1.0, 0.8, 0.8), vec3(0.8, 1.0, 0.8), vec3(1.0, 1.0, 1.0)); 


vec4 sampleColorRamp(int index) {
    float u = (float(index) + 0.5) / float(c_colorCount);
    u = clamp(u, 0.0, 1.0);
    return texture(u_colorbarTex, vec2(u,0.5));  
}

// color transfer function
vec4 value2color(float value)
{
  for(int i=0;i<c_colorBreakCount-1;++i) {
      if (value > c_colorBreaks[i] && value <= c_colorBreaks[i+1]) {                 
          vec4 c1 = sampleColorRamp(i);
          if (u_showContours)
              return c1;             
          vec4 c2 = sampleColorRamp(i + 1);
          float start = c_colorBreaks[i];
          float end = c_colorBreaks[i+1];
          if (i==0)
            start = end - 80.0;
          else if (i+1==c_colorBreakCount-1) 
            end = start + 80.0;
          //c1.a = 1.0;
          //c2.a = 1.0;
          return mix(c1, c2, (value-start)/(end-start));
      }
  }  
  return sampleColorRamp(0);             
}

czm_material czm_getMaterial(czm_materialInput materialInput)
{
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  float currentValue = sampleGridCell(u_floatTexCurrent, st, u_texSize);
  float nextValue = sampleGridCell(u_floatTexNext, st, u_texSize); 
  float interpValue = mix(currentValue, nextValue, u_transition);
  vec4 color = value2color(interpValue);             
  vec3 diffuse = color.rgb; 
  float a = color.a;     
  bool isOnGridLines = false;
  for (int i=0;i<4;++i) {
    if ((!u_showGrid && i > 0) || u_meridianDivisions[i] < 1.0)
        continue;

    float meridians = u_meridianDivisions[i];
    float tolerance = c_gridLineWidthScaling[i];
    float d1 = (st.s * meridians) - floor(st.s * meridians);
    float d2 = ceil(st.s * meridians) - (st.s * meridians);   
    bool isMeridian = false;    
    if (d1 < tolerance || d2 < tolerance) {
      isMeridian = true;
      isOnGridLines = true;
      diffuse = c_gridColors[i];
      a = 1.0;
    }

    float parallels = u_parallelDivisions[i];            
    d1 = (st.t * parallels) - floor(st.t * parallels);         
    d2 = ceil(st.t * parallels) - (st.t * parallels);
    if (!isMeridian && (d1 < tolerance || d2 < tolerance)) {
      isOnGridLines = true;
      diffuse = c_gridColors[i]; 
      a = 1.0;           
    }                 
  } 
  if (!u_showBluemarble) {
    material.alpha = u_layerAlpha * a;   
    material.diffuse = diffuse;
  }     
  else {
    material.alpha = 1.0;  
    material.diffuse = mix(texture(u_bluemarbleTex, st).rgb, diffuse, u_layerAlpha * a);
  }
  //vec2 screenCoords = gl_FragCoord.xy / czm_viewport.zw;
  //float depth = czm_unpackDepth(texture(czm_globeDepthTexture, screenCoords));
  //vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
  //depth = eyeCoordinate.z / eyeCoordinate.w;
  //material.diffuse = vec3(depth, depth, depth);
  return material;
}
`,we=`
in vec3 position;
uniform vec2 u_texSize; 
uniform vec2 u_querySize;             
uniform vec2 u_cursorUV;            
out vec2 v_uv;
out vec2 v_pixelOffset;           
void main() {
  gl_Position = vec4(position,1.0);
  v_uv = position.xy * 0.5;
  v_uv = v_uv * u_querySize / u_texSize;
  v_pixelOffset = v_uv * u_texSize;
  v_uv = u_cursorUV + v_uv; 
}
`,xe=`
out vec4 FragColor;
in vec2 v_uv;   
in vec2 v_pixelOffset;              
uniform vec2 u_cursorUV;
uniform vec2 u_querySize;   
// use linear interpolation to estimate the pressure value at the current moment based the known values at time n and n+1 
float interp(vec2 uv)
{
  float currentValue = sampleGridCell(u_floatTexCurrent, uv, u_texSize);
  float nextValue = sampleGridCell(u_floatTexNext, uv, u_texSize);  
  return mix(currentValue, nextValue, u_transition); 
}

void main() { 
  float interpValue = interp(v_uv);
  float cursorValue = interp(u_cursorUV);    
  float row = v_pixelOffset.y + 2.0;
  float col = v_pixelOffset.x + 2.0;         
  FragColor = vec4(interpValue, cursorValue, row, col);  
}
  `;class ye{constructor(e,i,t,s){this.g_frameBuffer=null,this.g_uniformMap=e,this.g_querySize=i,this.g_vertexShader=t,this.g_fragmentShader=s}createDrawCommand(e){const i={position:0},t=Cesium.Buffer.createVertexBuffer({usage:Cesium.BufferUsage.STATIC_DRAW,typedArray:new Float32Array([-1,-1,0,-1,1,0,1,-1,0,1,-1,0,-1,1,0,1,1,0]),context:e.context}),s=new Cesium.VertexArray({context:e.context,attributes:[{index:0,vertexBuffer:t,componentsPerAttribute:3,componentDatatype:Cesium.ComponentDatatype.FLOAT}]}),r=Cesium.ShaderProgram.fromCache({context:e.context,vertexShaderSource:this.g_vertexShader,fragmentShaderSource:this.g_fragmentShader,attributeLocations:i}),o=Cesium.RenderState.fromCache({depthTest:{enabled:!1},viewport:new Cesium.BoundingRectangle(0,0,this.g_querySize.cols,this.g_querySize.rows)});let a=new Cesium.Texture({context:e.context,width:this.g_querySize.cols,height:this.g_querySize.rows,pixelFormat:Cesium.PixelFormat.RGBA,pixelDatatype:Cesium.PixelDatatype.FLOAT});return this.g_frameBuffer=new Cesium.Framebuffer({context:e.context,colorTextures:[a],destroyAttachments:!1}),new Cesium.DrawCommand({vertexArray:s,primitiveType:Cesium.PrimitiveType.TRIANGLES,framebuffer:this.g_frameBuffer,shaderProgram:r,uniformMap:this.g_uniformMap,renderState:o,pass:Cesium.Pass.OPAQUE,modelMatrix:Cesium.Matrix4.IDENTITY})}update(e){Cesium.defined(this.commandToExecute)||(this.commandToExecute=this.createDrawCommand(e),this.commandToExecute.frameState=e),e.commandList.push(this.commandToExecute)}isDestroyed(){return!1}destroy(){return Cesium.defined(this.commandToExecute)&&(this.commandToExecute.shaderProgram=this.commandToExecute.shaderProgram&&this.commandToExecute.shaderProgram.destroy()),Cesium.destroyObject(this)}getQueryResults(){if(this.g_frameBuffer==null||!Cesium.defined(this.g_frameBuffer._framebuffer))return null;let e=this.g_frameBuffer._gl,i=new Float32Array(this.g_querySize.rows*this.g_querySize.cols*4);return e.bindFramebuffer(e.FRAMEBUFFER,this.g_frameBuffer._framebuffer),e.readPixels(0,0,this.g_querySize.rows,this.g_querySize.cols,e.RGBA,e.FLOAT,i),e.bindFramebuffer(e.FRAMEBUFFER,null),i}}class be{constructor(e){this.g_viewer=e,this.g_counter=0,this.g_particles=null,this.u_cameraPos=new Cesium.Cartesian3(0,0,0),this.u_texSize=new Cesium.Cartesian2(500,500),this.g_queryCount=0,this.g_isGlobe=e.scene.mode==Cesium.SceneMode.SCENE3D}createGlobeVertexArray(e,i){if(i==null)return null;let t=[],s=0;for(let n=0;n<i.length;n++){let l=i[n];if(!l.isVisible)continue;let h=this.unwrapLon(l.lonLat.lon),u=l.lonLat.lat,c=this.unwrapLon(l.lonLatNew.lon),m=l.lonLatNew.lat;t.push(h),t.push(u),t.push(s),t.push(c),t.push(m),t.push(s+1),s=s+2}this.g_queryCount=s;let r=new Float32Array(t);const o=Cesium.Buffer.createVertexBuffer({usage:Cesium.BufferUsage.DYNAMIC_DRAW,typedArray:r,context:e.context});return new Cesium.VertexArray({context:e.context,attributes:[{index:0,vertexBuffer:o,componentsPerAttribute:3,componentDatatype:Cesium.ComponentDatatype.FLOAT}]})}createPlanarVertexArray(e,i){if(i==null)return null;let t=[],s=[],r=0;for(let u=0;u<i.length;u++){let c=i[u];if(!c.isVisible)continue;let m=this.unwrapLon(c.lonLat.lon),g=c.lonLat.lat,d=this.unwrapLon(c.lonLatNew.lon),p=c.lonLatNew.lat;t.push(Cesium.Cartesian3.fromDegrees(m,g,0)),t.push(Cesium.Cartesian3.fromDegrees(d,p,0)),s.push(r,r),s.push(r+1,r+1),r=r+2}this.g_queryCount=r;let o=[];for(let u=0;u<t.length;u++)o.push(t[u].x,t[u].y,t[u].z);let a=new Float64Array(o),n=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:a}),st:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(s)})},primitiveType:Cesium.PrimitiveType.POINTS,boundingSphere:Cesium.BoundingSphere.fromVertices(a)});n=Cesium.GeometryPipeline.projectTo2D(n,"position","position3D","position2D"),n=Cesium.GeometryPipeline.encodeAttribute(n,"position2D","position2DHigh","position2DLow"),n=Cesium.GeometryPipeline.encodeAttribute(n,"position3D","position3DHigh","position3DLow");let l=Cesium.GeometryPipeline.createAttributeLocations(n),h=Cesium.VertexArray.fromGeometry({context:e.context,geometry:n,attributeLocations:l});return h.attributeLocations=l,h}createGlobeDrawCommand(e){const i={position:0},t=Cesium.Buffer.createVertexBuffer({usage:Cesium.BufferUsage.DYNAMIC_DRAW,typedArray:new Float32Array([0,0,0]),context:e.context}),s=new Cesium.VertexArray({context:e.context,attributes:[{index:0,vertexBuffer:t,componentsPerAttribute:3,componentDatatype:Cesium.ComponentDatatype.FLOAT}]}),a=Cesium.ShaderProgram.fromCache({context:e.context,vertexShaderSource:`
        in vec3 position;
        in vec3 normal;
        uniform vec3 u_cameraPos;
        uniform vec2 u_texSize;
        out vec3 v_positionEC;
        out vec3 v_normalEC;
        out vec2 v_st;
        const float R_equatorial = 6378137.0; // Equatorial radius
        const float R_polar = 6356752.3; // Polar radius
        vec3 wrapLon(vec3 lonlat)
        {
            if (lonlat.x < -180.0)
              lonlat.x = lonlat.x + 360.0;
            else if (lonlat.x > 180.0)
              lonlat.x = lonlat.x - 360.0;

            lonlat.y = clamp(lonlat.y, -90.0, 90.0);
            return lonlat;
        }

        float wrapLongitude(float degreesLon) {
            // Wrap longitude to the range [-180, 180]
            return mod(degreesLon + 180.0, 360.0) - 180.0;
        }

        float wrapLatitude(float degreesLat) {
            // Clamp latitude to the range [-90, 90]
            return clamp(degreesLat, -90.0, 90.0);
        }

        vec2 radiansToDegrees(vec2 radiansLonLat) {
            // Convert radians to degrees
            vec2 degreesLonLat = degrees(radiansLonLat);
            
            // Wrap longitude and latitude
            degreesLonLat.x = wrapLongitude(degreesLonLat.x);
            degreesLonLat.y = wrapLatitude(degreesLonLat.y);
            
            return degreesLonLat;
        }       
                
        vec3 lat_lon_to_xyz(vec3 lonlatHeight) {
          lonlatHeight = wrapLon(lonlatHeight);
          float lon = lonlatHeight.x;
          float lat = lonlatHeight.y;
          float height = lonlatHeight.z; // Height above sea level
          // Convert degrees to radians
          float lonRad = radians(lon);
          float latRad = radians(lat);
          
          // Prime vertical radius of curvature
          float N = (R_equatorial * R_equatorial) / sqrt((R_equatorial * R_equatorial) * cos(latRad) * cos(latRad) + (R_polar * R_polar) * sin(latRad) * sin(latRad));
          
          // Calculate Cartesian coordinates
          //float x = N * cos(latRad) * cos(lonRad);
          //float y = N * cos(latRad) * sin(lonRad);
          //float z = ((R_polar * R_polar) / (R_equatorial * R_equatorial)) * N * sin(latRad);

          float x = (N + height) * cos(latRad) * cos(lonRad);
          float y = (N + height) * cos(latRad) * sin(lonRad);
          float z = ((R_polar * R_polar) / (R_equatorial * R_equatorial)) * N * sin(latRad) + height * sin(latRad);

          vec3 pos = vec3(x, y, z);
          return pos;
        }

        float sphericalDistance(vec2 lonlat1, vec2 lonlat2) {
          // Constants for the equatorial and polar radii (in meters)

          // Calculate the mean Earth radius (approximated as the average)
          float R = (2.0 * R_equatorial + R_polar) / 3.0; // Average radius for better approximation

          float lat1 = radians(lonlat1.y);
          float lat2 = radians(lonlat2.y);
          float deltaLat = radians(lonlat2.y - lonlat1.y);
          float deltaLon = radians(lonlat2.x - lonlat1.x);

          // Haversine formula
          float a = sin(deltaLat / 2.0) * sin(deltaLat / 2.0) +
                    cos(lat1) * cos(lat2) *
                    sin(deltaLon / 2.0) * sin(deltaLon / 2.0);
          float c = 2.0 * atan(sqrt(a), sqrt(1.0 - a));

          // Distance in meters
          return R * c;
        }

        vec2 moveCoordinates(float lon, float lat, float u, float v, float m) {
          float flattening = (R_equatorial - R_polar) / R_equatorial; // Flattening factor

          // Calculate the radius at the given latitude using the formula for an ellipsoid
          float latRad = radians(lat);
          float R = R_equatorial * (1.0 - flattening * sin(latRad) * sin(latRad));

          // Normalize the direction vector
          float magnitude = sqrt(u * u + v * v);
          float normalizedU = u / magnitude;
          float normalizedV = v / magnitude;

          // Calculate the change in coordinates
          float delta = m / R; // Angular distance in radians

          float newLat = lat + degrees(delta * normalizedV);
          float newLon = lon + degrees(delta * normalizedU / cos(latRad));
          // Normalize longitude to stay within -180 to 180 degrees
          // newLon = ((newLon + 180) % 360 + 360) % 360 - 180;
          newLon = mod(newLon + 180.0, 360.0) - 180.0;
          bool isSouthPole = newLat < -90.0;
          if (isSouthPole)
            newLat = -newLat;
          if (newLat > 90.0) {
            float latToPole = newLat - 90.0;
            newLat = 90.0 - latToPole;
            newLon = newLon + 180.0;
            if (newLon > 180.0)
              newLon = newLon - 360.0;
          }

          if (isSouthPole)
            newLat = -newLat;

          return vec2(newLon, newLat);
        }

        float raySpheroidIntersection(vec3 p1, vec3 p2) {
            vec3 direction = p2 - p1;
            float a2 = R_equatorial * R_equatorial;
            float b2 = R_polar * R_polar;

            float A = direction.x * direction.x / a2 + direction.y * direction.y / a2 + direction.z * direction.z / b2;
            float B = 2.0 * (p1.x * direction.x / a2 + p1.y * direction.y / a2 + p1.z * direction.z / b2);
            float C = p1.x * p1.x / a2 + p1.y * p1.y / a2 + p1.z * p1.z / b2 - 1.0;
            //float A = dot(direction, direction) / a2;
            //float B = 2.0 * dot(p1, direction) / a2;
            //float C = dot(p1, p1) / a2 - 1.0;

            float discriminant = B * B - 4.0 * A * C;

            if (discriminant < 0.0) {
                return -1.0;
            }

            float t1 = (-B + sqrt(discriminant)) / (2.0 * A);
            float t2 = (-B - sqrt(discriminant)) / (2.0 * A);

            float t = min(t1, t2);
            if (t < 0.0) {
                t = max(t1, t2);
            }

            if (t < 0.0) {
                return -1.0;
            }

            vec3 intersectionPoint = p1 + t * direction;
            return distance(intersectionPoint, p2);
        }      
          
        out vec4 v_color;    
        out float v_intersectDist;    
        void main() {
          vec3 lonlatHeight = position;
          vec2 texelResol = vec2(1.0) / u_texSize;
          vec2 uv;
          float id = position.z;
          uv.y = floor(id / u_texSize.x);
          uv.x = id - u_texSize.x * floor(id / u_texSize.x);
          uv = uv / u_texSize;
          uv = uv + texelResol * 0.5;
          uv = uv * 2.0 - vec2(1.0);
          gl_Position = vec4(uv.x,uv.y,1.0,1.0);

          lonlatHeight.z = 1000.0;
          vec3 worldpos = lat_lon_to_xyz(lonlatHeight);
          //v_st = vec2((lonlatHeight.x+180.0)/360.0,(lonlatHeight.y-90.0)/180.0);
          gl_PointSize = 1.0;
          v_intersectDist = raySpheroidIntersection(worldpos, u_cameraPos);
          v_color = czm_modelViewProjection * vec4(worldpos, 1.0); 
          v_color.xyz = v_color.xyz/v_color.w;
          v_color.y = -v_color.y;
          v_color.xy = v_color.xy * 0.5 + vec2(0.5); 
          v_color.z = uv.x;
          v_color.w = id;
          if (v_intersectDist > 10000.0)
             v_color.xy = vec2(-2.0);
          //gl_Position = czm_modelViewProjection * vec4(worldpos, 1.0);
        }
      `,fragmentShaderSource:`
        precision mediump float;
        out vec4 FragColor;
        in vec4 v_color;
        void main() {
          FragColor = v_color;
        }
      `,attributeLocations:i}),n=Cesium.RenderState.fromCache({depthTest:{enabled:!1},viewport:new Cesium.BoundingRectangle(0,0,this.u_texSize.x,this.u_texSize.y),cull:{enabled:!1},colorMask:{red:!0,green:!0,blue:!0,alpha:!0}});let l=new Cesium.Texture({context:e.context,width:this.u_texSize.x,height:this.u_texSize.y,pixelFormat:Cesium.PixelFormat.RGBA,pixelDatatype:Cesium.PixelDatatype.FLOAT});return this.g_frameBuffer=new Cesium.Framebuffer({context:e.context,colorTextures:[l],destroyAttachments:!1}),new Cesium.DrawCommand({vertexArray:s,primitiveType:Cesium.PrimitiveType.POINTS,framebuffer:this.g_frameBuffer,shaderProgram:a,renderState:n,pass:Cesium.Pass.OPAQUE})}createPlanarDrawCommand(e){const i={isVisible:!0,lonLat:{lon:0,lat:0},lonLatNew:{lonNew:0,latNew:0}},t=this.createPlanarVertexArray(e,[i]),o=Cesium.ShaderProgram.fromCache({context:e.context,vertexShaderSource:`
        in vec3 position2DHigh;
        in vec3 position2DLow;
        in vec3 position3DHigh;
        in vec3 position3DLow;
        in vec2 st;
        in float compressedAttributes;
        vec3 normal;

        in float batchId;
        uniform vec3 u_cameraPos;
        uniform vec2 u_texSize;
        //in vec3 position;
        out vec4 v_positionEC;
        out vec2 v_st;
        out vec4 v_color;

        vec4 czm_computePosition()
        {
            vec4 p;
            if (czm_morphTime == 1.0)
            {
                p = czm_translateRelativeToEye(position3DHigh, position3DLow);
            }
            else if (czm_morphTime == 0.0)
            {
                p = czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy);
            }
            else
            {
                p = czm_columbusViewMorph(
                        czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy),
                        czm_translateRelativeToEye(position3DHigh, position3DLow),
                        czm_morphTime);
            }
            return p;
        }

        void main() {
          v_st = st;

          vec2 texelResol = vec2(1.0) / u_texSize;
          vec2 uv;
          float id = v_st.x;
          uv.y = floor(id / u_texSize.x);
          uv.x = id - u_texSize.x * floor(id / u_texSize.x);
          uv = uv / u_texSize;
          uv = uv + texelResol * 0.5;
          uv = uv * 2.0 - vec2(1.0);
          gl_Position = vec4(uv.x,uv.y,1.0,1.0);

          gl_PointSize = 1.0;
          vec4 p = czm_computePosition();
          v_color = czm_modelViewProjectionRelativeToEye * p; 
          v_color.xyz = v_color.xyz/v_color.w;
          v_color.y = -v_color.y;
          v_color.xy = v_color.xy * 0.5 + vec2(0.5); 
          v_color.z = uv.x;
          v_color.w = id;
        }
      `,fragmentShaderSource:`
        precision mediump float;
        out vec4 FragColor;
        in vec4 v_color;
        void main() {
          FragColor = v_color;
        }
      `,attributeLocations:t.attributeLocations}),a=Cesium.RenderState.fromCache({depthTest:{enabled:!1},viewport:new Cesium.BoundingRectangle(0,0,this.u_texSize.x,this.u_texSize.y),cull:{enabled:!1},colorMask:{red:!0,green:!0,blue:!0,alpha:!0}});let n=new Cesium.Texture({context:e.context,width:this.u_texSize.x,height:this.u_texSize.y,pixelFormat:Cesium.PixelFormat.RGBA,pixelDatatype:Cesium.PixelDatatype.FLOAT});return this.g_frameBuffer=new Cesium.Framebuffer({context:e.context,colorTextures:[n],destroyAttachments:!1}),new Cesium.DrawCommand({vertexArray:t,primitiveType:Cesium.PrimitiveType.POINTS,framebuffer:this.g_frameBuffer,shaderProgram:o,renderState:a,pass:Cesium.Pass.OPAQUE})}update(e){if(!Cesium.defined(this.commandToExecute)){this.commandToExecute=this.g_isGlobe?this.createGlobeDrawCommand(e):this.createPlanarDrawCommand(e);let t={pointsRenderer:null,u_cameraPos(){return this.pointsRenderer.u_cameraPos},u_texSize(){return this.pointsRenderer.u_texSize}};t.pointsRenderer=this,this.commandToExecute.uniformMap=t,this.commandToExecute.frameState=e}e.commandList.push(this.commandToExecute);let i=this.g_isGlobe?this.createGlobeVertexArray(e,this.g_particles):this.createPlanarVertexArray(e,this.g_particles);i!=null&&(this.commandToExecute.vertexArray=i)}isDestroyed(){return!1}resetSceneMode(e){this.g_isGlobe!=e&&(this.g_isGlobe=e,this.reset())}reset(){Cesium.defined(this.commandToExecute)&&(this.commandToExecute.shaderProgram=this.commandToExecute.shaderProgram&&this.commandToExecute.shaderProgram.destroy(),this.commandToExecute=null)}destroy(){return this.reset(),Cesium.destroyObject(this)}unwrapLon(e){for(;e<-180;)e=e+360;for(;e>180;)e=e-360;return e}drawFrameBuffer(e){if(this.g_frameBuffer==null||!Cesium.defined(this.g_frameBuffer._framebuffer)||this.g_particles==null||this.g_particles.length<1)return null;let i=e.getContext("2d");var t="rgba(0, 0, 0, 0.97)";i.fillStyle=t,i.globalCompositeOperation="destination-in",i.fillRect(0,0,e.width,e.height),i.globalCompositeOperation="lighter",i.imageSmoothingEnabled=!1;let s=this.g_frameBuffer._gl;const r=s.drawingBufferWidth,o=s.drawingBufferHeight;let a=new Uint8Array(r*o*4);s.bindFramebuffer(s.FRAMEBUFFER,this.g_frameBuffer._framebuffer),s.readPixels(0,0,r,o,s.RGBA,s.UNSIGNED_BYTE,a),s.bindFramebuffer(s.FRAMEBUFFER,null);const n=document.createElement("canvas");n.width=r,n.height=o;let l=n.getContext("2d");l.imageSmoothingEnabled=!1;const h=new ImageData(new Uint8ClampedArray(a),r,o);l.putImageData(h,0,0),l.scale(1,-1),l.drawImage(n,0,-o),i.drawImage(n,0,0,e.width,e.height)}getQueryResults(){if(this.g_frameBuffer==null||!Cesium.defined(this.g_frameBuffer._framebuffer)||this.g_particles==null)return null;let e=this.g_frameBuffer._gl,i=Math.floor(this.g_queryCount/this.u_texSize.x)+1,t=new Float32Array(this.u_texSize.x*i*4);return e.bindFramebuffer(e.FRAMEBUFFER,this.g_frameBuffer._framebuffer),e.readPixels(0,0,this.u_texSize.x,i,e.RGBA,e.FLOAT,t),e.bindFramebuffer(e.FRAMEBUFFER,null),t}}class Te{constructor(e){this.g_viewer=e,this.g_isGlobe=e.scene.mode==Cesium.SceneMode.SCENE3D}createPlanarRectangleGeometry(e,i){let t=[],s=57.2958;t.push(Cesium.Cartesian3.fromDegrees(e.west*s,e.south*s,i)),t.push(Cesium.Cartesian3.fromDegrees(e.west*s,e.north*s,i)),t.push(Cesium.Cartesian3.fromDegrees(e.east*s,e.north*s,i)),t.push(Cesium.Cartesian3.fromDegrees(e.east*s,e.south*s,i));let r=[];for(let n=0;n<t.length;n++)r.push(t[n].x,t[n].y,t[n].z);let o=new Float64Array(r),a=new Uint16Array([0,1,2,0,2,3]);return new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:o}),st:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array([1,0,1,1,0,1,0,0])})},indices:a,primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(o)})}createPointsGeometry(e,i){let t=[];for(let a=0;a<e.length;a++)t.push(Cesium.Cartesian3.fromDegrees(e[a].lon,e[a].lat,i));let s=[],r=[];for(let a=0;a<t.length;a++)s.push(t[a].x,t[a].y,t[a].z),r.push(a/(t.length-1),a/(t.length-1));let o=new Float64Array(s);return new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:o}),st:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(r)})},primitiveType:Cesium.PrimitiveType.POINTS,boundingSphere:Cesium.BoundingSphere.fromVertices(o)})}createVertexArray(e){let i=null;if(this.g_isGlobe){const r=Cesium.Rectangle.fromDegrees(-180,-90,180,90),o=new Cesium.RectangleGeometry({rectangle:r,vertexFormat:Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,granularity:10*.0174533,height:0});i=Cesium.RectangleGeometry.createGeometry(o)}else{const r=Cesium.Rectangle.fromDegrees(-180,-89.999,180,89.999);i=this.createPlanarRectangleGeometry(r,0)}i=Cesium.GeometryPipeline.projectTo2D(i,"position","position3D","position2D"),i=Cesium.GeometryPipeline.encodeAttribute(i,"position2D","position2DHigh","position2DLow"),i=Cesium.GeometryPipeline.encodeAttribute(i,"position3D","position3DHigh","position3DLow");let t=Cesium.GeometryPipeline.createAttributeLocations(i),s=Cesium.VertexArray.fromGeometry({context:e.context,geometry:i,attributeLocations:t});return s.attributeLocations=t,s}createDrawCommand(e){const i=this.createVertexArray(e),r=Cesium.ShaderProgram.fromCache({context:e.context,vertexShaderSource:`
        in vec3 position2DHigh;
        in vec3 position2DLow;
        in vec3 position3DHigh;
        in vec3 position3DLow;
        in vec3 position;
        in vec2 st;
        in float compressedAttributes;
        vec3 normal;

        in float batchId;
        //in vec3 position;
        out vec4 v_positionEC;
        out vec2 v_st;
        out vec3 v_color;

        vec4 czm_computePosition()
        {
            vec4 p;
            if (czm_morphTime == 1.0)
            {
                p = czm_translateRelativeToEye(position3DHigh, position3DLow);
            }
            else if (czm_morphTime == 0.0)
            {
                p = czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy);
            }
            else
            {
                p = czm_columbusViewMorph(
                        czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy),
                        czm_translateRelativeToEye(position3DHigh, position3DLow),
                        czm_morphTime);
            }
            return p;
        }

        void main() {
          v_st = st;
          vec4 p = czm_computePosition();
          gl_Position = czm_modelViewProjectionRelativeToEye * p; 
          //gl_Position = czm_modelViewProjection * vec4(position, 1.0);
          v_positionEC = (czm_inverseProjection * gl_Position);
        }
      `,fragmentShaderSource:`
        precision mediump float;
        out vec4 FragColor;
        in vec4 v_positionEC;
        in vec2 v_st;
        void main() {
          FragColor = vec4(v_st.x, v_st.y, czm_metersPerPixel(v_positionEC), 1.0);
          //FragColor = vec4(v_st.x, v_st.y, 0.0, 0.8);
        }
      `,attributeLocations:i.attributeLocations});let o=64,a=o*(e.context._gl.drawingBufferHeight/e.context._gl.drawingBufferWidth);for(a=Math.floor(a);a%4!=0;)a=a+1;this.g_width=o,this.g_height=a;const n=Cesium.RenderState.fromCache({clearColor:new Cesium.Color(0,0,0,0),depth:1,depthTest:{enabled:!0},cull:{enabled:!0},viewport:new Cesium.BoundingRectangle(0,0,o,a)});let l=new Cesium.Texture({context:e.context,width:o,height:a,pixelFormat:Cesium.PixelFormat.RGBA,pixelDatatype:Cesium.PixelDatatype.FLOAT});return this.g_frameBuffer=new Cesium.Framebuffer({context:e.context,colorTextures:[l],destroyAttachments:!1}),new Cesium.DrawCommand({vertexArray:i,primitiveType:Cesium.PrimitiveType.TRIANGLES,framebuffer:this.g_frameBuffer,shaderProgram:r,renderState:n,pass:Cesium.Pass.OPAQUE})}update(e){Cesium.defined(this.commandToExecute)||(this.commandToExecute=this.createDrawCommand(e),this.commandToExecute.frameState=e),e.commandList.push(this.commandToExecute),new Cesium.ClearCommand({color:new Cesium.Color(0,0,0,0),depth:1,framebuffer:this.g_frameBuffer}).execute(e.context)}resetSceneMode(e){this.g_isGlobe!=e&&(this.g_isGlobe=e,this.reset())}reset(){Cesium.defined(this.commandToExecute)&&(this.commandToExecute.shaderProgram=this.commandToExecute.shaderProgram&&this.commandToExecute.shaderProgram.destroy(),this.commandToExecute=null)}isDestroyed(){return!1}destroy(){return Cesium.defined(this.commandToExecute)&&(this.commandToExecute.shaderProgram=this.commandToExecute.shaderProgram&&this.commandToExecute.shaderProgram.destroy()),Cesium.destroyObject(this)}getMask(){if(this.g_frameBuffer==null||!Cesium.defined(this.g_frameBuffer._framebuffer))return null;let e=this.g_frameBuffer._gl;const i=this.g_width,t=this.g_height;let s=new Float32Array(i*t*4);e.bindFramebuffer(e.FRAMEBUFFER,this.g_frameBuffer._framebuffer),e.readPixels(0,0,i,t,e.RGBA,e.FLOAT,s),e.bindFramebuffer(e.FRAMEBUFFER,null);const r=[];let o=0,a=0,n=0,l=i,h=0,u=t,c=0,m=this.g_viewer.scene.canvas.width,g=this.g_viewer.scene.canvas.height,d=i/m;for(let w=0;w<t;w++)for(let x=0;x<i;x++){if(s[o+3]<.5||isNaN(s[o])||isNaN(s[o+1])){o=o+4;continue}let C=s[o+2];C>0&&!isNaN(C)&&(C=C*d,a=a+C,n=n+1);let b=-180+s[o]*360,S=-90+s[o+1]*180;r.push({lon:b,lat:S,metersPerPixel:C}),o=o+4,l=Math.min(l,x),h=Math.max(h,x),u=Math.min(u,w),c=Math.max(c,w)}l=l/(i-1)*m,h=h/(i-1)*m,u=u/(t-1)*g,c=c/(t-1)*g;let p=a/n;return{data:r,xmin:l,xmax:h,ymin:u,ymax:c,width:h-l,height:c-u,metersPerPixel:p}}drawFrameBuffer(e){if(this.g_frameBuffer==null||!Cesium.defined(this.g_frameBuffer._framebuffer))return null;let i=this.g_frameBuffer._gl;const t=this.g_width,s=this.g_height;let r=new Uint8Array(t*s*4);i.bindFramebuffer(i.FRAMEBUFFER,this.g_frameBuffer._framebuffer),i.readPixels(0,0,t,s,i.RGBA,i.UNSIGNED_BYTE,r),i.bindFramebuffer(i.FRAMEBUFFER,null);const o=document.createElement("canvas");o.width=t,o.height=s;const a=o.getContext("2d"),n=new ImageData(new Uint8ClampedArray(r),t,s);a.putImageData(n,0,0),a.scale(1,-1),a.drawImage(o,0,-s),e.drawImage(o,0,0,o.width,o.height)}}class Le{constructor(){this.g_pointsRenderer=null}resetVariables(e,i,t,s,r){this.g_timer=null,this.g_uComp=i,this.g_vComp=t,this.g_tComp=s,this.g_north=e.north,this.g_south=e.south,this.g_west=e.west,this.g_east=e.east,this.g_dy=e.dy,this.g_dx=e.dx,this.g_gridWidth=e.width,this.g_gridHeight=e.height,this.g_particles=null,this.g_vertices=null,this.g_is2D=!1,this.g_canvas=null,this.g_show=!0,this.MAX_PARTICLE_AGE=100,this.PARTICLE_LINE_WIDTH=1.5,this.PARTICLE_MULTIPLIER=1/200,this.PARTICLE_REDUCTION=.75,this.FRAME_RATE=15,this.τ=2*Math.PI,this.g_lonSpan=360,this.g_previousLonSpan=0,this.g_regions=[{west:-180,east:180,south:-90,north:90}],this.g_frameCount=0,this.g_mask=[],this.g_viewer=r,this.g_isCameraMoving=!1,this.g_lastCameraPos=null}initialize(e,i,t,s,r){if(this.g_pointsRenderer)this.g_viewer.camera.moveStart.removeEventListener(this.moveStartListener),this.g_viewer.camera.moveEnd.removeEventListener(this.moveEndListener),this.g_viewer.scene.preRender.removeEventListener(this.preRenderListener),this.g_viewer.scene.postRender.removeEventListener(this.postRenderListener),this.g_viewer.scene.morphComplete.removeEventListener(this.morphCompleteListener),this.resetVariables(e,i,t,s,r);else{this.resetVariables(e,i,t,s,r),this.moveStartListener=()=>this.g_isCameraMoving=!0,this.moveEndListener=()=>this.g_isCameraMoving=!1,this.preRenderListener=()=>this.preRender(),this.postRenderListener=()=>this.postRender(),this.morphCompleteListener=()=>{let a=this.g_viewer.scene.mode==Cesium.SceneMode.SCENE3D;this.g_pointsRenderer.resetSceneMode(a),this.g_customWorldRenderer.resetSceneMode(a)},this.g_pointsRenderer=new be(this.g_viewer),this.g_viewer.scene.primitives.add(this.g_pointsRenderer);let o=this.g_viewer.scene.mode==Cesium.SceneMode.SCENE3D;this.g_pointsRenderer.resetSceneMode(o),this.g_customWorldRenderer=new Te(this.g_viewer),this.g_viewer.scene.primitives.add(this.g_customWorldRenderer),this.g_customWorldRenderer.resetSceneMode(o)}this.g_viewer.camera.moveStart.addEventListener(this.moveStartListener),this.g_viewer.camera.moveEnd.addEventListener(this.moveEndListener),this.g_viewer.scene.preRender.addEventListener(this.preRenderListener),this.g_viewer.scene.postRender.addEventListener(this.postRenderListener),this.g_viewer.scene.morphComplete.addEventListener(this.morphCompleteListener),this.g_frameCount=0,this.resetAllParticles()}xy2lonlat(e,i){let t=new Cesium.Cartesian2(e,i);const s=this.g_viewer.camera.pickEllipsoid(t,this.g_viewer.scene.globe.ellipsoid);if(s){const r=Cesium.Cartographic.fromCartesian(s),o=Cesium.Math.toDegrees(r.longitude),a=Cesium.Math.toDegrees(r.latitude);return{lon:o,lat:a}}else return{lon:0,lat:0}}lonlat2xy(e,i){if(this.g_viewer.scene.mode!=Cesium.SceneMode.SCENE2D){let o=Cesium.Cartesian3.fromDegrees(e,i),a=Cesium.SceneTransforms.wgs84ToWindowCoordinates(g_viewer.scene,o);return{x:a.x,y:a.y}}if(e<this.g_region.west||e>this.g_region.east||i>this.g_region.north||i<this.g_region.south)return{x:-1,y:-1};let t=(e-this.g_region.west)/this.g_region.lonspan*this.g_viewer.scene.canvas.width,s=(this.g_region.north-i)/(this.g_region.north-this.g_region.south),r=this.g_region.top+(this.g_region.bottom-this.g_region.top)*s;return{x:t,y:r}}preRender(){if(!this.g_canvas||!this.g_show)return;this.g_frameCount=this.g_frameCount+1;let e=this.g_viewer.camera.position,i=!1;this.m_lastCameraPos!=null&&Cesium.Cartesian3.distance(this.m_lastCameraPos,e)>100&&(i=!0),this.m_lastCameraPos=new Cesium.Cartesian3(e.x,e.y,e.z),this.g_isCameraMoving=i;let t=this.g_viewer,s=t.scene.mode==Cesium.SceneMode.SCENE2D,r={west:-180,east:180,south:-90,north:90};if(s){let u={x:0,y:t.scene.canvas.height/2},c={x:t.scene.canvas.width,y:t.scene.canvas.height/2},m=this.xy2lonlat(u.x,u.y),g=this.xy2lonlat(c.x,c.y),d=this.xy2lonlat(t.scene.canvas.width/2,t.scene.canvas.height/2),p=m.lon,w=g.lon;d.lon<p&&(d.lon=p+(180-p)+(d.lon+180));let x=Math.abs(d.lon-p)*2;w=p+x;let C=t.scene.canvas.width/x,b=t.scene.canvas.height/C,S=d.lat+b*.5;S=Math.min(S,90);let O=b-d.lat,P=d.lat-O;P=Math.max(P,-90),r.west=p,r.degree2pixel=C,r.east=w,r.north=S,r.south=P,r.lonspan=x,r.center=d,r.top=t.scene.canvas.height*.5-(S-d.lat)*C,r.top=Math.max(r.top,0),r.bottom=t.scene.canvas.height*.5+(d.lat-P)*C,r.bottom=Math.min(r.bottom,t.scene.canvas.height),this.g_region=r}else{var o=t.camera.computeViewRectangle(t.scene.globe.ellipsoid);if(o){var a=Cesium.Math.toDegrees(o.west),n=Cesium.Math.toDegrees(o.south),l=Cesium.Math.toDegrees(o.east),h=Cesium.Math.toDegrees(o.north);r={west:a,east:l,south:n,north:h}}}this.updateRegion(r,s),(!this.g_particles||this.g_particles.length<10)&&this.resetParticles(this.g_canvas.width,this.g_canvas.height),this.evolve(),s||(this.g_pointsRenderer.u_cameraPos=t.camera.position,this.g_pointsRenderer.g_particles=this.g_particles)}postRender(){if(!this.g_canvas||!this.g_show)return;let e=this.g_viewer;Cesium.Cartographic.fromCartesian(this.g_viewer.scene.camera.position),this.g_canvas.style.display!="block"&&(this.g_canvas.style.display="block");let i=e.scene.mode==Cesium.SceneMode.SCENE2D;this.g_canvas.getContext("2d"),!i&&this.g_frameCount%5==0&&this.setMask(this.g_customWorldRenderer.getMask());let t=null;!i&&(t=this.g_pointsRenderer.getQueryResults(),!t)||this.drawParticles(t)}deg2rad(e){return e/180*Math.PI}rad2deg(e){return e/(Math.PI/180)}fillNaN(e){e[0]<-9e3&&(e[0]=0),e[1]<-9e3&&(e[1]=0)}bilinearInterpolateVector(e,i,t,s,r,o,a){var n=1-e,l=1-i,h=n*l,u=e*l,c=n*i,m=e*i,g=t[0]*h+s[0]*u+r[0]*c+o[0]*m,d=t[1]*h+s[1]*u+r[1]*c+o[1]*m,p=null;return this.g_tComp&&(p=t[2]*h+s[2]*u+r[2]*c+o[2]*m),g=g*a,d=d*a,[g,d,Math.sqrt(g*g+d*d),p]}getUV(e,i){let t=e*this.g_gridWidth+i;var s=[this.g_uComp[t],this.g_vComp[t],this.g_tComp?this.g_tComp[t]:null];return this.fillNaN(s),s}floorMod(e,i){return e-i*Math.floor(e/i)}interpolate(e,i,t=-1){if(i>this.g_north||i<this.g_south)return null;var s=this.floorMod(e-this.g_west,360)/this.g_dx,r=(this.g_north-i)/this.g_dy,o=Math.floor(s),a=o+1,n=Math.floor(r),l=n+1;o<0&&(o=this.g_gridWidth-1),o>this.g_gridWidth-1&&(o=0),n<0&&(n=0),n>this.g_gridHeight-1&&(o=this.g_gridHeight-1),a>this.g_gridWidth-1&&(a=this.g_gridWidth-1),a<0&&(a=0),l>this.g_gridHeight-1&&(l=this.g_gridHeight-1),l<0&&(l=0);let h=this.getUV(n,o),u=this.getUV(n,a),c=this.getUV(l,o),m=this.getUV(l,a),g=1;if(t>0){let d=5,p=this.g_maskWidth*t;g=1/d*p/this.FRAME_RATE/50}return this.bilinearInterpolateVector(s-o,r-n,h,u,c,m,g)}uvToDegrees(e,i){let t=Math.atan2(-e,-i)*(180/Math.PI);return t<0&&(t+=360),t}getWindAt(e,i){let t=this.interpolate(e,i),s=this.uvToDegrees(t[0],t[1]);return{speed:t[2],direction:s}}moveCoordinates(e,i,t,s,r){const n=(6378137-63567523e-1)/6378137,l=this.deg2rad(i),h=6378137*(1-n*Math.sin(l)*Math.sin(l)),u=Math.sqrt(t*t+s*s),c=t/u,m=s/u,g=r/h;let d=i+this.rad2deg(g*m),p=e+this.rad2deg(g*c/Math.cos(l));p=(p+180)%360-180;let w=d<-90;return w&&(d=-d),d>90&&(d=90-(d-90),p=p+180,p>180&&(p=p-360)),w&&(d=-d),{lon:p,lat:d}}sphericalDistance(e,i,t,s){const a=(2*6378137+63567523e-1)/3,n=this.deg2rad(i),l=this.deg2rad(s),h=this.deg2rad(s-i),u=this.deg2rad(t-e),c=Math.sin(h/2)*Math.sin(h/2)+Math.cos(n)*Math.cos(l)*Math.sin(u/2)*Math.sin(u/2),m=2*Math.atan2(Math.sqrt(c),Math.sqrt(1-c));return a*m}getEarthCircumferenceAtLatitude(e){const t=63567523e-1,s=e*Math.PI/180,r=Math.sqrt(6378137*6378137*Math.cos(s)*Math.cos(s)+t*t*Math.sin(s)*Math.sin(s));return 2*Math.PI*r}calMetersPerPixel(e){let i=Math.min(Math.abs(e),85),t=this.getEarthCircumferenceAtLatitude(i);return t=t*(this.g_lonSpan/360),t/this.g_width}randomize(e){if(!this.g_is2D&&this.g_mask.length>20){let o=Math.floor(Math.random()*this.g_mask.length),a=this.g_mask[o],n=this.g_mask[o].metersPerPixel,l=a.lon,h=a.lat,u=this.getEarthCircumferenceAtLatitude(h),c=n*50/u*360;return l=this.unwrapLon(l+Math.random()*c-c*.5),h=h+Math.random()*c-c*.5,h=Math.min(h,90),h=Math.max(h,-90),e.metersPerPixel=a.metersPerPixel,e.lonLat={lon:l,lat:h},e}let i=this.g_regions[0],t=Math.random()*this.g_lonSpan,s=this.unwrapLon(i.west+t),r=i.south+Math.random()*(i.north-i.south);return e.metersPerPixel=this.g_pixelResol,this.g_is2D&&(e.metersPerPixel=this.calMetersPerPixel(r)),e.lonLat={lon:s,lat:r},e}evolve(){var e;if(((e=this.g_particles)==null?void 0:e.length)>0)for(let i=0;i<this.g_particles.length;i++){let t=this.g_particles[i];(t.age>this.MAX_PARTICLE_AGE||!t.isVisible)&&(this.randomize(t).age=0);let s=t.lonLat,r=this.isInWorldExtent(s);if(!r){t.age=this.MAX_PARTICLE_AGE+1,t.isVisible=!1;continue}if(t.v=this.interpolate(s.lon,s.lat,t.metersPerPixel),!t.v||t.v[0]==0&&t.v[1]==0){t.age=this.MAX_PARTICLE_AGE+1,t.isVisible=!1;continue}let o=this.moveCoordinates(s.lon,s.lat,t.v[0],t.v[1],t.v[2]);if(r=this.isInWorldExtent(o),!r){t.age=this.MAX_PARTICLE_AGE+1,t.isVisible=!1;continue}if(Math.floor(Math.random()*10)==9){t.age=this.MAX_PARTICLE_AGE+1,t.isVisible=!1;continue}t.lonLatNew=o,t.isVisible=!0,t.age+=1}}getColorFromSpeedBin(e){const i=Math.max(0,Math.min(e,20));let t,s=40,r=75,o;return i<=5?(t=130-i/5*20,o=.2+i/5*.1):i<=15?(t=300+(i-5)/10*30,o=.3+(i-5)/10*.1):(t=20-(20-i)/5*20,s=50,r=70,o=.4+(i-15)/5*.1),`hsla(${t.toFixed(1)}, ${s}%, ${r}%, ${o.toFixed(2)})`}drawParticles2DInRegion(e,i){for(let t=0;t<this.g_particles.length;t++){const s=this.g_particles[t];if(!s.isVisible)continue;let r={lon:s.lonLat.lon,lat:s.lonLat.lat},o={lon:s.lonLatNew.lon,lat:s.lonLatNew.lat};if(r.lon=this.wrapLon(r.lon),o.lon=this.wrapLon(o.lon),r.lon==null||o.lon==null){s.isVisible=!1,s.age=this.MAX_PARTICLE_AGE+1;continue}const a=this.lonlat2xy(r.lon,r.lat),n=this.lonlat2xy(o.lon,o.lat);if(a.x<0||n.x<0||a.x>this.g_width||n.x>this.g_width||a.y<0||n.y<0||a.y>this.g_height||n.y>this.g_height){s.isVisible=!1,s.age=this.MAX_PARTICLE_AGE+1;continue}const l=n.x-a.x,h=n.y-a.y,u=Math.sqrt(l*l+h*h);if(u>10){s.isVisible=!1,s.age=this.MAX_PARTICLE_AGE+1;continue}e.strokeStyle=this.getColorFromSpeedBin(u),e.beginPath(),e.moveTo(a.x+this.g_canvasLeft,a.y+this.g_canvasTop),e.lineTo(n.x+this.g_canvasLeft,n.y+this.g_canvasTop),e.stroke(),s.lonLatNew.lon=this.unwrapLon(s.lonLatNew.lon),s.lonLat=s.lonLatNew,s.metersPerPixel=this.calMetersPerPixel(s.lonLatNew.lat)}}drawParticles2D(e,i){const t=this.g_canvas.getContext("2d");t.lineWidth=this.PARTICLE_LINE_WIDTH,t.fillStyle=i,t.globalCompositeOperation="destination-in",t.fillRect(0,this.g_regions[0].top,this.g_width,this.g_regions[0].bottom-this.g_regions[0].top),t.globalCompositeOperation="lighter",this.g_regions[0];for(let s=0;s<this.g_particles.length;s++){const r=this.g_particles[s];if(!r.isVisible)continue;let o={lon:r.lonLat.lon,lat:r.lonLat.lat},a={lon:r.lonLatNew.lon,lat:r.lonLatNew.lat};if(o.lon=this.wrapLon(o.lon),a.lon=this.wrapLon(a.lon),o.lon==null||a.lon==null){r.isVisible=!1,r.age=this.MAX_PARTICLE_AGE+1;continue}const n=this.lonlat2xy(o.lon,o.lat),l=this.lonlat2xy(a.lon,a.lat);if(n.x<0||l.x<0||n.x>this.g_width||l.x>this.g_width||n.y<0||l.y<0||n.y>this.g_height||l.y>this.g_height){r.isVisible=!1,r.age=this.MAX_PARTICLE_AGE+1;continue}const h=l.x-n.x,u=l.y-n.y,c=Math.sqrt(h*h+u*u);if(c>10){r.isVisible=!1,r.age=this.MAX_PARTICLE_AGE+1;continue}t.strokeStyle=this.getColorFromSpeedBin(c),t.beginPath(),t.moveTo(n.x+this.g_canvasLeft,n.y+this.g_canvasTop),t.lineTo(l.x+this.g_canvasLeft,l.y+this.g_canvasTop),t.stroke(),r.lonLatNew.lon=this.unwrapLon(r.lonLatNew.lon),r.lonLat=r.lonLatNew,r.metersPerPixel=this.calMetersPerPixel(r.lonLatNew.lat)}}drawParticles3D(e,i){const t=this.g_canvas.getContext("2d");t.lineWidth=this.PARTICLE_LINE_WIDTH,t.fillStyle=i,t.globalCompositeOperation="destination-in",t.fillRect(this.g_canvasLeft,this.g_canvasTop,this.g_width,this.g_height),t.globalCompositeOperation="lighter";const s=new Map;let r=0;for(let o=0;o<this.g_particles.length;o++){const a=this.g_particles[o];if(!a.isVisible)continue;const n={x:e[r],y:e[r+1]};r+=4;const l={x:e[r],y:e[r+1]};if(r+=4,n.x<0||l.x<0||n.x>1||l.x>1||n.y<0||l.y<0||n.y>1||l.y>1){a.isVisible=!1,a.age=this.MAX_PARTICLE_AGE+1;continue}n.x*=this.g_width,n.y*=this.g_height,l.x*=this.g_width,l.y*=this.g_height;const h=l.x-n.x,u=l.y-n.y,c=Math.sqrt(h*h+u*u);if(c>20){a.isVisible=!1,a.age=this.MAX_PARTICLE_AGE+1;continue}const m=this.getColorFromSpeedBin(c);s.has(m)||s.set(m,[]),s.get(m).push([{x:n.x+this.g_canvasLeft,y:n.y+this.g_canvasTop},{x:l.x+this.g_canvasLeft,y:l.y+this.g_canvasTop}]),a.lonLatNew.lon=this.unwrapLon(a.lonLatNew.lon),a.lonLat=a.lonLatNew}for(const[o,a]of s.entries()){t.strokeStyle=o,t.beginPath();for(const[n,l]of a)t.moveTo(n.x,n.y),t.lineTo(l.x,l.y);t.stroke()}}drawParticles(e){this.g_canvas.getContext("2d");let t=`rgba(0, 0, 0, ${this.g_isCameraMoving?.8:.95})`;this.g_is2D?this.drawParticles2D(null,t):this.drawParticles3D(e,t)}setCanvas(e,i,t,s,r){this.g_canvas=e,this.g_canvasLeft=i,this.g_canvasTop=t,this.g_width=s,this.g_height=r,this.g_maskWidth=this.g_width,this.g_maskHeight=this.g_height}resetParticles(e,i){let t=Math.round(e*i*this.PARTICLE_MULTIPLIER);if(t*=this.PARTICLE_REDUCTION,!(Math.abs(t-this.g_particleCount)<10))if(this.g_particleCount=t,this.g_particles==null){this.g_particles=[];for(var s=0;s<this.g_particleCount;s++)this.g_particles.push(this.randomize({age:Math.floor(Math.random()*this.MAX_PARTICLE_AGE)+0,isVisible:!1}))}else{let o=this.g_particles.length;for(var r=[],s=0;s<this.g_particleCount;s++)s<o?r.push(this.g_particles[s]):r.push(this.randomize({age:Math.floor(Math.random()*this.MAX_PARTICLE_AGE)+0,isVisible:!1}));this.g_particles=r}}unwrapLon(e){for(;e<-180;)e=e+360;for(;e>180;)e=e-360;return e}wrapLon(e){return!this.g_is2D||e>=this.g_regions[0].west&&e<=this.g_regions[0].east?e:e+360>=this.g_regions[0].west&&e+360<=this.g_regions[0].east?e+360:e-360>=this.g_regions[0].west&&e-360<=this.g_regions[0].east?e-360:null}isInWorldExtent(e){if(!this.g_is2D&&this.g_mask.length>20)return!0;let i=this.g_is2D?this.wrapLon(e.lon):this.unwrapLon(e.lon);if(i==null)return!1;let t=e.lat;for(let s=0;s<this.g_regions.length;s++){let r=this.g_regions[s];if(i>=r.west&&i<=r.east&&t>=r.south&&t<=r.north)return!0}return!1}setMask(e){this.g_mask=e.data,this.g_maskWidth=e.width,this.g_maskHeight=e.height,this.resetParticles(this.g_width,this.g_height)}resetAllParticles(){this.g_particles=[],this.g_particleCount=0,this.resetParticles(this.g_width,this.g_height)}updateRegion(e,i){let t=i!=this.g_is2D;this.g_is2D=i;let s=this.g_lonSpan;if(this.g_previousLonSpan=s,i){this.g_regions=[e],this.g_lonSpan=Math.abs(e.east-e.west),t&&this.resetAllParticles();return}if(e.east>e.west)this.g_regions=[e],this.g_lonSpan=Math.abs(e.east-e.west);else{this.g_regions=[],this.g_regions.push({west:e.west,east:180,south:e.south,north:e.north});let r=this.unwrapLon(e.east);this.g_regions.push({west:-180,east:r,south:e.south,north:e.north}),this.g_lonSpan=180-e.west+(e.east+180)}t&&this.resetAllParticles()}show(e){if(this.g_show=e,e){let i=this.g_viewer.scene.mode==Cesium.SceneMode.SCENE3D;this.g_pointsRenderer.resetSceneMode(i),this.g_customWorldRenderer.resetSceneMode(i),this.g_pointsRenderer.show=!0,this.g_customWorldRenderer.show=!0,this.g_canvas.style.display="block"}else this.g_pointsRenderer.show=!1,this.g_customWorldRenderer.show=!1,this.g_canvas.style.display="none"}}class Se extends EventTarget{constructor(){super(),this.g_selectableTimeseries=[],this.g_selectedTime=null,this.g_lastSelectedTime=null,this.g_colorBar=null,this.g_selectedVariable=-1,this.g_variables=[],this.g_cursorReadout="",this.g_animationTime="",this.g_showCursorReadout=!1,this.g_cursorScreenCoords={x:0,y:0},this.g_showContours=!0,this.g_showGrid=!1,this.g_labelGridCells=!1,this.g_enableBilinearSampling=!0,this.g_showWindAnimation=!0,this.g_layerAlpha=80,this.g_TimeSeriesLookup=null,this.g_weatherMapMaterial=null,this.g_variables=[],this.g_variableData=null,this.g_cursorGeoCoords=null,this.g_cursorValue="",this.g_querySize={rows:41,cols:41},this.g_serverURL="",this.g_isTokenDefined=!1,this.g_weatherMapSize=new Cesium.Cartesian2(1,1),this.g_weatherMapPicker=null,this.g_cursorGeoCoords=null,this.g_cursorValue="",this.g_weatherMapImageOverlay=null,this.g_isInitialized=!1,this.g_prefetchAllImages=!1,this.g_cacheAllImages=!0,this.g_elapsedTime=0,this.g_isInTransition=!1,this.g_reverseTransition=null,this.g_lastStep=0,this.g_isQueryDirty=!0,this.g_transitionDuration=1e3,this.g_viewer=null,this.g_querySize={rows:41,cols:41},this.g_gridCellLabels=null,this.g_majorGridLines=null,this.g_resourceLoader=null,this.g_windy=null}getTransition(){return this.g_transitionDuration==0?0:this.g_elapsedTime/this.g_transitionDuration}formatDateToString(e){const i=e.getFullYear(),t=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0"),r=String(e.getHours()).padStart(2,"0"),o=String(e.getMinutes()).padStart(2,"0");return String(e.getSeconds()).padStart(2,"0"),`${i}-${t}-${s} ${r}:${o}`}dateFromString(e){return new Date(e.replaceAll(" ","T").concat("Z"))}JulianDateFromString(e){return Cesium.JulianDate.fromIso8601(e.replaceAll(" ","T").concat("Z"))}async updateTransition(){if(!this.g_isInitialized||this.g_weatherMapMaterial==null)return;this.g_weatherMapMaterial.uniforms.u_enableBilinear=this.g_enableBilinearSampling;let i=this.g_viewer.camera.positionCartographic.height/1e3,t=this.g_layerAlpha/100,s=!1,r=!1,o=[0,0,0,0],a=[0,0,0,0];if(this.g_isTokenDefined&&i<2e3&&(t=t*Math.pow(i/2e3,.5)),i<600?(this.g_weatherMapSize.x==360*4?(o[3]=360*4,a[3]=this.g_weatherMapSize.y):this.g_weatherMapSize.x==360*2?(o[3]=360*2,a[3]=this.g_weatherMapSize.y):(o[3]=this.g_weatherMapSize.x,a[3]=this.g_weatherMapSize.y),r=i>100):i<2e3?(o[2]=360,a[2]=180,this.g_weatherMapSize.x==360&&(o[2]=360,a[2]=this.g_weatherMapSize.y,r=!0)):i<8e3?(o[2]=360/5,a[2]=180/5):i<1e6&&(s=!0),this.g_majorGridLines.show=this.g_showGrid&&s,this.g_gridCellLabels.show=this.g_labelGridCells&&r,this.g_weatherMapMaterial.uniforms.u_layerAlpha=t,this.g_weatherMapMaterial.uniforms.u_meridianDivisions=new Cesium.Cartesian4(o[0],o[1],o[2],o[3]),this.g_weatherMapMaterial.uniforms.u_parallelDivisions=new Cesium.Cartesian4(a[0],a[1],a[2],a[3]),this.g_weatherMapMaterial.uniforms.u_showGrid=this.g_showGrid,!this.g_isInitialized||!this.g_isInTransition)return;this.g_isInTransition=!1;let n=Cesium.JulianDate.toDate(this.g_viewer.clock.currentTime),l=this.g_timeSeriesLookup[0].time,h=n.getTime()-l.getTime(),u=Math.round(Math.abs(n.getTime()-l.getTime())/1e3/3600),c=0;h<0&&this.g_viewer.clock.multiplier<0?(c=this.g_selectableTimeseries.length-2,n=this.dateFromString(this.g_selectableTimeseries[c+1]),this.g_viewer.clock.currentTime=this.JulianDateFromString(this.g_selectableTimeseries[c+1])):h<0||!(u in this.g_timeSeriesLookup)?(c=0,n=l,this.g_viewer.clock.currentTime=this.JulianDateFromString(this.g_selectableTimeseries[c])):(u=Math.floor(h/1e3/3600),c=this.g_timeSeriesLookup[u].step);let m=this.g_resourceLoader.timestampToImageURL(this.g_selectableTimeseries[c]),g=m,d=this.dateFromString(this.g_selectableTimeseries[c]);this.g_selectedTime=c;let p=n.getTime()-d.getTime();this.g_lastStep!=c&&(p=0,this.g_lastStep=c);let w=p;c>=this.g_selectableTimeseries.length-1?g=this.g_resourceLoader.timestampToImageURL(this.g_selectableTimeseries[0]):(w=this.dateFromString(this.g_selectableTimeseries[c+1])-d.getTime(),g=this.g_resourceLoader.timestampToImageURL(this.g_selectableTimeseries[c+1]));const C=this.g_weatherMapMaterial._textures.u_floatTexCurrent,b=this.g_weatherMapMaterial._textures.u_floatTexNext,S=C.url,O=b.url;if(!this.g_prefetchAllImages&&this.g_viewer.clock.shouldAnimate&&this.g_resourceLoader.prefetchImages(this.g_selectableTimeseries,this.g_selectedTime,6),C.url==m&&b.url==g)this.g_reverseTransition=!1;else if(C.url==g&&b.url==m)this.g_reverseTransition=!0;else if(C.url!=m&&b.url!=g&&C.url!=g&&b.url!=m){this.g_reverseTransition=!1;let L=await this.g_resourceLoader.fetchImageData(m);C.copyFrom(L),C.url=m;let fe=m==g?L:await this.g_resourceLoader.fetchImageData(g);b.copyFrom(fe),b.url=g}else if(C.url==m){this.g_reverseTransition=!1;let L=await this.g_resourceLoader.fetchImageData(g);b.copyFrom(L),b.url=g}else if(C.url==g){this.g_reverseTransition=!0;let L=await this.g_resourceLoader.fetchImageData(m);b.copyFrom(L),b.url=m}else if(b.url==m){this.g_reverseTransition=!0;let L=await this.g_resourceLoader.fetchImageData(g);C.copyFrom(L),C.url=g}else if(b.url==g){this.g_reverseTransition=!1;let L=await this.g_resourceLoader.fetchImageData(m);C.copyFrom(L),C.url=m}!this.g_prefetchAllImages&&!this.g_cacheAllImages&&this.g_resourceLoader.removeCachedImages([m,g,S,O]),this.g_transitionDuration=w,this.g_elapsedTime=p,this.g_animationTime=this.formatDateToString(n);const P=this.getTransition();this.g_weatherMapMaterial.uniforms.u_transition=this.g_reverseTransition?1-P:P,this.g_isInTransition=!0,this.fireForcastTimeChangedEvent()}resetWindCanvas(){this.g_viewer.scene.canvas.getBoundingClientRect();let e=this.g_viewer.scene.canvas;this.g_windCanvas.width=e.width,this.g_windCanvas.height=e.height,this.g_windCanvas.style.width=e.width+"px",this.g_windCanvas.style.height=e.height+"px",this.g_windCanvas.style.display!="block"&&(this.g_windCanvas.style.display="block")}async initializeWind(){var l;if(!this.g_isInitialized||this.g_weatherMapMaterial==null||!this.g_showWindAnimation)return;let e=this.g_selectableTimeseries[this.g_selectedTime];if(((l=this.g_windy)==null?void 0:l.timestamp)==e)return;let i=e.replaceAll(" ","-").replaceAll(":","-"),t=`/timeseries/${i}-u10.png`,s=`/timeseries/${i}-v10.png`,r=await this.loadImage(t),o=await this.loadImage(s),a={west:-180,east:180,south:-90,north:90,dx:360/this.g_weatherMapSize.x,dy:180/this.g_weatherMapSize.y,width:this.g_weatherMapSize.x,height:this.g_weatherMapSize.y};this.g_windy||(this.g_windy=new Le),this.g_windy.initialize(a,r.data,o.data,null,this.g_viewer),this.g_windy.timestamp=e,this.g_windy.setCanvas(this.g_windCanvas,0,0,this.g_windCanvas.width,this.g_windCanvas.height),this.fireWindUpdatedEvent(),this.resetWindCanvas(),new ResizeObserver(h=>{this.resetWindCanvas(),this.g_windy.setCanvas(this.g_windCanvas,0,0,this.g_windCanvas.width,this.g_windCanvas.height)}).observe(this.g_viewer.scene.canvas)}refreshColorBar(e){var r,o;if(!this.g_isInitialized||!Cesium.defined((o=(r=this.g_weatherMapMaterial)==null?void 0:r._textures)==null?void 0:o.u_colorbarTex))return;this.g_colorBar=e;const i=this.g_resourceLoader.colorRampToByteArray(this.g_colorBar);let t={width:this.g_colorBar.length,height:1,arrayBufferView:i};this.g_weatherMapMaterial._textures.u_colorbarTex.copyFrom({source:t})}showContours(e){this.g_showContours=e,!(!this.g_isInitialized||!this.g_weatherMapMaterial)&&(this.g_weatherMapMaterial.uniforms.u_showContours=e)}showGrid(e){this.g_showGrid=e}setLayerAlpha(e){this.g_layerAlpha=e}setEnableBilinearSampling(e){this.g_enableBilinearSampling=e}setLabelGridCells(e){this.g_labelGridCells=e}showWind(e){this.g_showWindAnimation=e,this.g_windy.show(e)}show(e){this.g_weatherMapImageOverlay.show=e,this.g_weatherMapPicker.show=e}createWeatherMapPicker(){let e=this;const i={u_floatTexCurrent(){var s,r;return(r=(s=e.g_weatherMapMaterial)==null?void 0:s._textures)==null?void 0:r.u_floatTexCurrent},u_floatTexNext(){var s,r;return(r=(s=e.g_weatherMapMaterial)==null?void 0:s._textures)==null?void 0:r.u_floatTexNext},u_transition(){let s=e.getTransition();return e.g_reverseTransition?1-s:s},u_texSize(){return e.g_weatherMapSize},u_enableBilinear(){return e.g_enableBilinearSampling},u_querySize(){return new Cesium.Cartesian2(e.g_querySize.rows,e.g_querySize.cols)},u_cursorUV(){if(e.g_cursorGeoCoords!=null){let s=(e.g_cursorGeoCoords.x+180)/360,r=(e.g_cursorGeoCoords.y+90)/180;return new Cesium.Cartesian2(s,r)}return new Cesium.Cartesian2(0,0)}};let t=j+`
`+xe;return new ye(i,this.g_querySize,we,t)}createWeatherMapRenderer(e){const i=this.g_resourceLoader.rgbaArrayToBase64Png(this.g_resourceLoader.colorRampToByteArray(e),e.length,1);let t=[],s=[];for(let g=0;g<e.length;g++){t.push(e[g].min.toFixed(1));let d=e[g].rgb;s.push(`vec3(${d[0].toFixed(1)},${d[1].toFixed(1)},${d[2].toFixed(1)})`),g==e.length-1&&t.push(e[g].max.toFixed(1))}let r=t.join(","),o=s.join(","),a=t.length,n=s.length,l=` 
  const int c_colorBreakCount = ${a};
  const int c_colorCount = ${n};
  const float c_colorBreaks[${a}] = float[${a}](${r});
  const vec3 c_colorRamp[${n}] = vec3[${n}](${o});
  ${j}
  ${Ce}
  `,h=new Cesium.Material({fabric:{type:"WeatherMapMaterial",uniforms:{u_floatTexCurrent:"",u_floatTexNext:"",u_colorbarTex:i,u_bluemarbleTex:"",u_showBluemarble:!1,u_showContours:this.g_showContours,u_transition:1,u_layerAlpha:1,u_showGrid:this.g_showGrid,u_meridianDivisions:new Cesium.Cartesian4(0,0,0,0),u_parallelDivisions:new Cesium.Cartesian4(0,0,0,0),u_texSize:new Cesium.Cartesian2(1,1),u_enableBilinear:this.g_enableBilinearSampling},source:l},translucent:!1});h._magnificationFilter=9728,h._minificationFilter=9728,this.g_isTokenDefined||(h.uniforms.u_bluemarbleTex="/assets/bluemarble.jpg"),h.uniforms.u_showBluemarble=!this.g_isTokenDefined;let u=this.g_selectableTimeseries[0],c=this.g_selectableTimeseries[1];return h.uniforms.u_transition=0,h.uniforms.u_floatTexCurrent=this.g_resourceLoader.timestampToImageURL(u),h.uniforms.u_floatTexNext=this.g_resourceLoader.timestampToImageURL(c),h.uniforms.u_texSize=this.g_weatherMapSize,new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:new Cesium.RectangleGeometry({rectangle:Cesium.Rectangle.fromDegrees(-180,-90,180,90),vertexFormat:Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,granularity:1*.0174533})}),appearance:new Cesium.EllipsoidSurfaceAppearance({aboveGround:!1,material:h}),asynchronous:!1})}selectVariable(e){if(this.g_selectedVariable==e||this.g_variables.length<e+1)return;this.g_lastSelectedTime=null,this.g_selectedVariable=e,this.g_isInitialized=!1,this.g_variableData=this.g_variables[e];let i=this.g_variableData.griddef;this.g_weatherMapSize=new Cesium.Cartesian2(i.cols,i.rows),this.g_resourceLoader=new ve(this.g_variableData.name,""),this.g_colorBar=this.loadColorBar(this.g_variableData.colorbar);let t=this.g_selectableTimeseries[0],s=this.g_selectableTimeseries[1];this.g_weatherMapImageOverlay!=null&&(this.g_weatherMapMaterial=null,this.g_viewer.scene.primitives.remove(this.g_weatherMapImageOverlay),this.g_weatherMapImageOverlay=null),this.g_weatherMapImageOverlay=this.createWeatherMapRenderer(this.g_variableData.colorbar),this.g_weatherMapMaterial=this.g_weatherMapImageOverlay.appearance.material,this.g_weatherMapMaterial.uniforms.u_floatTexCurrent=this.g_resourceLoader.timestampToImageURL(t),this.g_weatherMapMaterial.uniforms.u_floatTexNext=this.g_resourceLoader.timestampToImageURL(s),this.g_weatherMapMaterial.uniforms.u_texSize=this.g_weatherMapSize,this.g_viewer.scene.primitives.add(this.g_weatherMapImageOverlay),this.g_isInitialized=!1}createMajorGridLines(){let e=10;this.g_majorGridLines=new Cesium.CustomDataSource("majorGridLines"),this.g_majorGridLines.show=!0,this.g_viewer.dataSources.add(this.g_majorGridLines);for(let i=-180;i<=180;i+=e){let t=[];for(let s=-90;s<=90;s+=10){let r=Cesium.Cartesian3.fromDegrees(i,s,1e4);t.push(r)}this.g_majorGridLines.entities.add({polyline:{positions:t,width:1,material:Cesium.Color.WHITE}})}for(let i=-90;i<=90;i+=e){let t=[];for(let s=-180;s<=180;s+=10){let r=Cesium.Cartesian3.fromDegrees(s,i,1e4);t.push(r)}this.g_majorGridLines.entities.add({polyline:{positions:t,width:1,material:Cesium.Color.WHITE}})}}createGridCellLabels(){this.g_gridCellLabels=new Cesium.CustomDataSource("gridCellLabels"),this.g_gridCellLabels.show=!1,this.g_gridCellLabels.labelEntities=[],this.g_viewer.dataSources.add(this.g_gridCellLabels);for(let e=0;e<this.g_querySize.rows;e++){let i=[];for(let t=0;t<this.g_querySize.cols;t++){let s={lon:180-e,lat:0},r=this.g_gridCellLabels.entities.add({position:Cesium.Cartesian3.fromDegrees(s.lon,s.lat,100),label:{text:`${s.lon},${s.lat}`,font:"10pt sans-serif",fillColor:Cesium.Color.YELLOW,outlineColor:Cesium.Color.YELLOW,outlineWidth:2,style:Cesium.LabelStyle.FILL_AND_OUTLINE,disableDepthTestDistance:Number.POSITIVE_INFINITY,pixelOffset:new Cesium.Cartesian2(0,0)}});i.push(r)}this.g_gridCellLabels.labelEntities.push(i)}}loadColorBar(e){for(let i=0;i<e.length;i++){e[i].mask=!0;let t=e[i].color,s=t;i<e.length-1&&(s=e[i+1].color),e[i].gradientStyle=`background-image: linear-gradient(to bottom, ${t}, ${s})`,e[i].colorStyle=`background-color: ${t}`}return e}handleMouseMove(e){if(!this.g_isInitialized)return;let i=new Cesium.Cartesian2(e.pageX,e.pageY),t=this.g_viewer.scene.globe.ellipsoid,s=this.g_viewer.camera.pickEllipsoid(i,t);if(s){let r=t.cartesianToCartographic(s);this.g_cursorGeoCoords=new Cesium.Cartesian2(Cesium.Math.toDegrees(r.longitude),Cesium.Math.toDegrees(r.latitude)),this.g_cursorScreenCoords={x:e.pageX,y:e.pageY},i.y>this.g_viewer.scene.canvas.height-75&&(i.y=this.g_viewer.scene.canvas.height-75),i.x>this.g_viewer.scene.canvas.width-200&&(i.x=this.g_viewer.scene.canvas.width-200),this.g_cursorScreenCoords={x:i.x,y:i.y},this.g_showCursorReadout=!0,this.g_isQueryDirty=!0}else this.g_cursorReadout="",this.g_cursorGeoCoords=null,this.g_showCursorReadout=!1}updateQueryResults(){var h,u,c,m;if(!this.g_isInitialized){Cesium.defined((u=(h=this.g_weatherMapMaterial)==null?void 0:h._textures)==null?void 0:u.u_floatTexCurrent)&&Cesium.defined((c=this.g_weatherMapMaterial._textures)==null?void 0:c.u_floatTexNext)&&this.g_weatherMapMaterial._textures.u_floatTexCurrent._id!=this.g_weatherMapMaterial._textures.u_floatTexNext._id&&(this.g_weatherMapMaterial._textures.u_floatTexCurrent.url=this.g_weatherMapMaterial.uniforms.u_floatTexCurrent,this.g_weatherMapMaterial._textures.u_floatTexNext.url=this.g_weatherMapMaterial.uniforms.u_floatTexNext,this.g_isInitialized=!0,this.g_isInTransition=!0);return}if(!this.g_isQueryDirty&&!this.g_viewer.clock.shouldAnimate||this.g_weatherMapPicker==null||Math.floor(performance.now())%5!=0||!Cesium.defined((m=this.g_cursorGeoCoords)==null?void 0:m.y))return;let i=this.g_weatherMapPicker.getQueryResults();if(i==null)return;let t=0,s=360/this.g_weatherMapSize.x,r=180/this.g_weatherMapSize.y,o=Math.floor((90-this.g_cursorGeoCoords.y)/r),a=Math.floor((this.g_cursorGeoCoords.x+180)/s),n=Math.floor(this.g_querySize.rows/2),l=Math.floor(this.g_querySize.cols/2);o-this.g_querySize.rows,a-this.g_querySize.cols;for(let g=-n;g<=n;g++){let d=90-(o+g)*r-r*.5;for(let p=-l;p<=l;p++){let w=-180+(a+p)*s+s*.5,x=this.g_gridCellLabels.labelEntities[g+n][p+l];x.position=Cesium.Cartesian3.fromDegrees(w,d,100),x.label.text=`${i[t].toFixed(1)}`,t=t+4}}this.g_cursorValue=i[1],this.g_isQueryDirty=!1}updateCursorReadout(){if(!this.g_isInitialized)return;if(this.g_cursorGeoCoords==null||this.g_cursorValue==""){this.g_cursorReadout="";return}if(!this.g_showCursorReadout)return;let e=this.g_cursorGeoCoords.x.toFixed(2),i=this.g_cursorGeoCoords.y.toFixed(2),t=this.g_cursorValue.toFixed(1),s=e>0?"E":"W",r=i>0?"N":"S";this.g_cursorReadout=`${t}${this.g_variableData.unit} ${Math.abs(e)}°${s} ${Math.abs(i)}°${r}`}fireCursorReadoutEvent(){const e=new CustomEvent("cursorReadoutUpdatedEvent",{detail:{showCursorReadout:this.g_showCursorReadout,cursorReadout:this.g_cursorReadout,cursorScreenCoords:this.g_cursorScreenCoords,animationTime:this.g_animationTime}});this.dispatchEvent(e)}fireTimeSeriesLoadedEvent(){const e=new CustomEvent("timeSeriesLoadedEvent",{detail:{variables:this.g_variables,selectableTimeseries:this.g_selectableTimeseries,selectedTime:this.g_selectedTime,selectedVariable:this.g_selectedVariable,colorBar:this.g_colorBar}});this.dispatchEvent(e)}fireForcastTimeChangedEvent(){if(this.g_lastSelectedTime==this.g_selectedTime)return;this.g_lastSelectedTime=this.g_selectedTime;const e=new CustomEvent("forcastTimeChangedEvent",{detail:{selectedTime:this.g_selectedTime,animationTime:this.g_animationTime}});this.dispatchEvent(e)}fireWindUpdatedEvent(){const e=new CustomEvent("windUpdatedEvent",{detail:{windDataProvider:this.g_windy}});this.dispatchEvent(e)}loadImage(e){return new Promise((t,s)=>{let r=new Image;r.crossOrigin="anonymous",r.onload=function(){let a=document.createElement("canvas").getContext("webgl2");a.activeTexture(a.TEXTURE0);let n=a.createTexture();a.bindTexture(a.TEXTURE_2D,n);const l=a.createFramebuffer();a.bindFramebuffer(a.FRAMEBUFFER,l),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,n,0),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,this),a.drawBuffers([a.COLOR_ATTACHMENT0]);let h=new Uint8Array(r.width*r.height*4);a.readPixels(0,0,r.width,r.height,a.RGBA,a.UNSIGNED_BYTE,h),a.deleteTexture(n),a.deleteFramebuffer(l);let u=a.getExtension("WEBGL_lose_context");u&&u.loseContext();let c=new Float32Array(r.width*r.height);new ImageData(r.width,r.height).data;function g(d,p,w,x){return d<<24|p<<16|w<<8|x>>>0}for(let d=0;d<r.height;d++)for(let p=0;p<r.width;p++){let w=(d*r.width+p)*4,x={r:h[w],g:h[w+1],b:h[w+2],a:h[w+3]},C=x.r+x.g*256+x.b*65536+x.a*16777216;C=g(x.a,x.b,x.g,x.r),C=C/10,c[w/4]=C}t({width:r.width,height:r.height,data:c})},r.onerror=()=>{s(new Error(`Failed to load image: ${e}`))},r.src=e})}async refreshTimeSeries(e=!0){if(this.g_isInitialized=!1,this.g_weatherMapPicker!=null&&(this.g_viewer.scene.primitives.remove(this.g_weatherMapPicker),this.g_weatherMapPicker=null),this.g_colorBar=[],this.g_selectedTime=0,this.g_lastSelectedTime=null,this.g_selectableTimeseries=[],!e)return;const i=await fetch("/timeseries/timeseries.json",{method:"GET",cache:"reload"});if(!i.ok){alert(`Failed to fetch timeseries. Response status: ${i.status}`);return}let t=await i.json();this.g_selectableTimeseries=t.timeseries,this.g_variables=t.variables;let s=this.dateFromString(this.g_selectableTimeseries[0]),r=this.dateFromString(this.g_selectableTimeseries[this.g_selectableTimeseries.length-1]),o=Math.round(Math.abs(s.getTime()-r.getTime())/1e3/3600);this.g_timeSeriesLookup={};for(let l=1;l<this.g_selectableTimeseries.length;l++){let h=this.dateFromString(this.g_selectableTimeseries[l-1]),u=this.dateFromString(this.g_selectableTimeseries[l]),c=Math.round(Math.abs(Math.abs(u.getTime()-h.getTime())/1e3/3600)),m=Math.round(Math.abs(Math.abs(h.getTime()-s.getTime())/1e3/3600));for(let g=0;g<c;g++)this.g_timeSeriesLookup[m+g]={step:l-1,time:h,name:this.g_selectableTimeseries[l-1]}}this.g_timeSeriesLookup[o]={step:this.g_selectableTimeseries.length-1,time:r,name:this.g_selectableTimeseries[this.g_selectableTimeseries.length-1]},this.g_isTokenDefined=Cesium.defined(Cesium.Ion.defaultAccessToken)&&Cesium.Ion.defaultAccessToken.length>5,this.g_selectedTime=0,this.g_weatherMapPicker=this.createWeatherMapPicker(),this.g_viewer.scene.primitives.add(this.g_weatherMapPicker);const a=this.JulianDateFromString(this.g_selectableTimeseries[0]),n=this.JulianDateFromString(this.g_selectableTimeseries[this.g_selectableTimeseries.length-1]);this.g_viewer.clock.startTime=a,this.g_viewer.clock.stopTime=n,this.g_viewer.clock.clockRange=Cesium.ClockRange.LOOP_STOP,this.g_viewer.clock.currentTime=a,this.g_viewer.timeline.zoomTo(a,n),this.g_elapsedTime=0,this.g_transitionDuration=0,this.g_isInTransition=!1,this.g_reverseTransition=!1,this.g_isInitialized=!1,this.selectVariable(0),this.fireTimeSeriesLoadedEvent(),this.g_prefetchAllImages&&this.g_resourceLoader.prefetchAllImages(g_selectableTimeseries)}initialize(e,i){this.g_viewer=e,this.g_isInitialized=!1,this.g_weatherMapMaterial=null,this.g_weatherMapPicker=null,this.g_windCanvas=i,this.refreshTimeSeries(!0),this.g_viewer.clock.onTick.addEventListener(t=>{this.updateTransition()}),this.g_viewer.scene.canvas.onmousemove=t=>{this.handleMouseMove(t)},this.g_viewer.scene.preRender.addEventListener(()=>{this.updateCursorReadout(),this.fireCursorReadoutEvent()}),this.g_viewer.scene.postRender.addEventListener(()=>{this.updateQueryResults()}),this.createMajorGridLines(),this.createGridCellLabels(),setInterval(()=>{this.initializeWind()},500)}}new Cesium.Cartesian2;const Ee=100;class Pe{constructor(e){var l,h;this._options=e;const i=e.point,t=i.coordinates[0],s=i.coordinates[1],r=i.coordinates[2],o=e.viewer;this._viewer=o,this._favorite=!1,this._hasChange=!1,this._isUserPOI=!1,this._isSharedPOI=!1,this._longitude=t,this._latitude=s,this._originalLongitude=t,this._originalLatitude=s,r?this._height=r:this._height=Ee,this._changedID=e.properties.ID,this._cameraProps=null,(l=e.properties)!=null&&l.Height&&(this._height=Number((h=e.properties)==null?void 0:h.Height)),this._originalHeight=this._height,this._bottomHeight=0,this._epnElevation=0,this._originalBottomHeight=e.properties.bottomHeight?e.properties.bottomHeight:0,e.isUserPOI&&(this._isUserPOI=e.isUserPOI),e.isSharedPOI&&(this._isSharedPOI=e.isSharedPOI),this._isShow=!1;const a=[];a.push(Cesium.Cartesian3.fromDegrees(t,s,this._bottomHeight)),a.push(Cesium.Cartesian3.fromDegrees(t,s,this._height+this._bottomHeight)),this._color=Cesium.Color.BLACK,this._chimneyHeight=40,this._chimneyPrimitiveShow=!1,this._particleCloudSimulationProps={windDirection:0,windSpeed:5,emissionSize:9},this._particlePrimitiveShow=!1,this._properties=e.properties,this._addFlareStakes(),this._addParticleCloud();let n="/assets/marker_red.png";this._billboard=e.billboardCollection.add({id:e.properties.ID,position:Cesium.Cartesian3.fromDegrees(t,s,this._height),image:n,pixelOffset:new Cesium.Cartesian2(0,-20),width:24,height:24,scale:1,scaleByDistance:new Cesium.NearFarScalar(1e4,.8,1e6,.3),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,2e7),heightReference:Cesium.HeightReference.RELATIVE_TO_GROUND}),this.showHide(!1)}get properties(){return this._properties}get favorite(){return this._favorite}set favorite(e){this._favorite=e}get hasChange(){return this._hasChange}set hasChange(e){this._hasChange=e}get changedBasemap(){return this._changedBaseMap}set changedBasemap(e){this._changedBaseMap=e}get isUserPOI(){return this._isUserPOI}set isUserPOI(e){this._isUserPOI=e}get isSharedPOI(){return this._isSharedPOI}set isSharedPOI(e){this._isSharedPOI=e}get isShow(){return this._isShow}set isShow(e){this._isShow=e}get longitude(){return this._longitude}get latitude(){return this._latitude}get height(){return this._height}set height(e){this._height=e,this._update()}get chimneyShow(){return this._chimneyPrimitiveShow}set chimneyShow(e){this._chimneyPrimitiveShow=e}get originalHeight(){return this._originalHeight}get originalLongitude(){return this._originalLongitude}get originalLatitude(){return this._originalLatitude}get originalBottomHeight(){return this._originalBottomHeight}get chimneyPrimitive(){return this._chimneyPrimitive}get bottomHeight(){return this._bottomHeight}set bottomHeight(e){this._bottomHeight=e;const i=[];i.push(Cesium.Cartesian3.fromDegrees(this._longitude,this._latitude,this._bottomHeight)),i.push(Cesium.Cartesian3.fromDegrees(this._longitude,this._latitude,this._height+this._bottomHeight))}get epnElevation(){return this._epnElevation}set epnElevation(e){this._epnElevation=e}get billboard(){return this._billboard}get changedID(){return this._changedID}set changedID(e){this._changedID=e}get cameraProps(){return this._cameraProps}set cameraProps(e){this._cameraProps=e}get particlePrimitive(){return this._particlePrimitive}async _addFlareStakes(){const e=this._viewer.scene.primitives,i=Cesium.Cartesian3.fromDegrees(this.longitude,this.latitude,this._bottomHeight),s=this._height/this._chimneyHeight,r=Cesium.Transforms.headingPitchRollToFixedFrame(i,new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0))),o=await Cesium.Model.fromGltfAsync({id:"flare_stake",modelMatrix:r,url:"/assets/flare.gltf",scale:s});this._chimneyPrimitive=e.add(o),o.readyEvent.addEventListener(()=>{this._chimneyHeight=this._height,this._chimneyPrimitive&&(this._options.chimneyCollection.push(this._chimneyPrimitive),this._chimneyPrimitive.show=this._chimneyPrimitiveShow)})}async _addParticleCloud(){const e=Cesium.Cartesian3.fromDegrees(this.longitude,this.latitude,this._height+this._bottomHeight+.5),i=Cesium.Transforms.headingPitchRollToFixedFrame(e,new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0))),t="/assets/smoke.png",s={particleSize:10,speed:0,particleLife:5,length:30},r=(o,a,n,l)=>{const h=s.length*(Math.random()*.04+.01),u=Cesium.Ellipsoid.WGS84,c=new Cesium.Matrix4;Cesium.Transforms.eastNorthUpToFixedFrame(o.position,u,c);const m=Cesium.Math.toRadians(n),g=new Cesium.Cartesian3,d=Math.atan(a/h);g.x=h*Math.sin(d)*Math.sin(m),g.y=h*Math.sin(d)*Math.cos(m),g.z=h*Math.cos(d),o.position=Cesium.Matrix4.multiplyByPoint(c,g,new Cesium.Cartesian3)};this._particlePrimitive=this._options.particleCollection.add(new Cesium.ParticleSystem({image:t,startColor:Cesium.Color.WHITE.withAlpha(.7),endColor:Cesium.Color.WHITE.withAlpha(.1),startScale:1,endScale:5,particleLife:s.particleLife,speed:s.speed,lifetime:s.particleLife,sizeInMeters:!0,imageSize:new Cesium.Cartesian2(s.particleSize,s.particleSize),updateCallback:(o,a)=>{const{windSpeed:n,windDirection:l}=this._particleCloudSimulationProps;r(o,n,l)}})),this._particlePrimitive&&(this._particlePrimitive.modelMatrix=i,this._particlePrimitive.show=!1)}setVisibleEmissionCloud(e){this._particlePrimitive&&(this._particlePrimitive.show=e),this.showHide(!0)}changePrticleCloudSimulationProps(e){if(this._particleCloudSimulationProps=e,this._particlePrimitive){const i={particleSize:10,particleLife:5};this._particlePrimitive.maximumImageSize=new Cesium.Cartesian2(i.particleSize*(e.emissionSize/9),i.particleSize*(e.emissionSize/9)),this._particlePrimitive.lifetime=i.particleLife*(e.emissionSize/9)}}exportAsGeoJSON(){return this._height<0&&console.warn("invalid height detected.",this._properties),this._properties.bottomHeight=this._bottomHeight,{type:"Feature",geometry:{type:"Point",coordinates:[this._longitude,this._latitude,this._height]},properties:this.properties}}get id(){return this._properties.ID}getPosition(e){return Cesium.Cartesian3.clone(this._billboard.position,e),e}getEmissionPosition(){return Cesium.Cartesian3.fromDegrees(this.longitude,this.latitude,this._height+this._bottomHeight+3)}getEmissionPosition1(){return Cesium.Cartesian3.fromDegrees(this.longitude,this.latitude,this._height+this._bottomHeight+20)}getPropertiesForUI(){const e={ID:this.id,longitude:this.longitude,latitude:this.latitude,Height:this.height};return Object.entries(this.properties||{}).map(([i,t])=>{i!=="id"&&i!=="Height"&&i!=="bottomHeight"&&(e[i]=t)}),this.properties.details&&(e.details=this.properties.details),e}getType(){return this._properties.Marker}showHide(e){this._isShow=e,this._particlePrimitive&&(this._particlePrimitive.show=e),this._chimneyPrimitive&&(this._chimneyPrimitive.show=e),this._cloudPrimitive&&(this._cloudPrimitive.show=e)}chimneyShowHide(e){this._chimneyPrimitiveShow=e,this._chimneyPrimitive&&(this._chimneyPrimitive.show=this._chimneyPrimitiveShow)}getShow(){return this._billboard.show}getVerticalLength(){return this._height}setVerticalLength(e){this._height=e,this._update()}getName(){return this._properties.Name}zoomToPOI(){const e=this._viewer,i=Cesium.Math.toRadians(-26),t=50,s=this.getPosition(new Cesium.Cartesian3),r=t;e.camera.flyToBoundingSphere(new Cesium.BoundingSphere(s,2),{offset:new Cesium.HeadingPitchRange(0,i,r)})}}const{createApp:Re,ref:v,onMounted:Me}=Vue;let y=new Se,I=v(500),k=v(500),V=v([]),F=v(),R=v(),z=v(0),W=v([]),Y=v(!0),J=v(!1),Q=v(!1),Z=v(!0),U=v(!0),Ae=v(!1),De=v(""),q=v(!1),B=v(!1),H=v(!0),K=v("Show about"),ee=v(""),te=v(""),ie=v(!1),se=v({x:0,y:0}),re=v(80),ae=v(!0),oe=v(null),ne=v(null),le=v([]),A=v(null),he=v(null),E=[],ue=v([]),T=v(null),G=v(null),ce=v(!0),N=v(!1),ge=v({}),me=v({}),de=v(-1),f=null,M=null,D=null,$=null;const _e=1e4;function Ie(){q.value=!0}function ze(){q.value=!1}function Fe(){B.value=!B.value,K.value="Hide about"}function Be(_,e){let t=(Math.atan2(-_,-e)*(180/Math.PI)+360)%360;const s=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];let r=Math.round(t/22.5)%16;return s[r]}async function Ne(_,e){const t=await(await fetch(`http://108.175.3.61:40001/get_weather_forcast_at_location?lon=${_}&lat=${e}`)).json(),s=t.min_max;me.value=t.units,Object.entries(s).forEach(([n,l])=>{l=l.slice(1,l.length>7?7:l.length-1),s[n]=l});const r=s.U10,o=s.V10,a=s.Wind;for(let n=0;n<r.length;n++){const l=Be(r[n].mean,o[n].mean);a[n].label=`${a[n].label} ${l}`}ge.value={Temperature:s.Temperature,Wind:s.Wind,Humidity:s.Humidity,Cloud:s.Cloud,Rain:s.Rain,Snow:s.Snow,Pressure:s.Rain},$.position=Cesium.Cartesian3.fromDegrees(_,e)}async function pe(){const _=new Cesium.Cartesian2(f.canvas.clientWidth/2,f.canvas.clientHeight/2),e=f.scene.camera.pickEllipsoid(_);if(e){const i=Cesium.Cartographic.fromCartesian(e),t=Cesium.Math.toDegrees(i.longitude),s=Cesium.Math.toDegrees(i.latitude);Ne(t,s)}}async function Oe(){I.value=document.documentElement.clientHeight-20,k.value=I.value-120,window.onresize=function(){I.value=document.documentElement.clientHeight-20,k.value=I.value-100},Cesium.Ion.defaultAccessToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmODJhYjE1Ni03MTRjLTQ4YzAtODM1MS1iMmE4NDNmNmY1YmUiLCJpZCI6MTgyMDQ2LCJpYXQiOjE3MjgyNTA1Mjl9.07ruEXxJJZWTvgrc7YcFwJd2AiZA5oEl-i53bbYCQII",Cesium.Camera.DEFAULT_VIEW_FACTOR=0,f=new Cesium.Viewer("cesiumContainer",{contextOptions:{requestWebgl2:!0},baseLayerPicker:!1,imageryProvider:new Cesium.IonImageryProvider({assetId:3954}),shouldAnimate:!0}),M=f.scene;const _=Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3954));f.scene.imageryLayers.add(_);const e=await Cesium.IonResource.fromAssetId(3312402),i=await Cesium.GeoJsonDataSource.load(e);await f.dataSources.add(i),oe=f.scene.primitives.add(new Cesium.PrimitiveCollection),ne=f.scene.primitives.add(new Cesium.PrimitiveCollection),A=new Cesium.BillboardCollection({blendOption:Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT}),le=[],he=f.scene.primitives.add(new Cesium.CloudCollection({noiseDetail:16,noiseOffset:Cesium.Cartesian3.ZERO})),f.scene.primitives.add(A),document.getElementById("timeseries").addEventListener("change",h=>{const u=y.JulianDateFromString(V.value[F.value]);f.clock.currentTime=u}),document.getElementById("variables").addEventListener("change",h=>{y.selectVariable(z.value)}),$=f.entities.add({label:{text:"+",font:"36px monospace",fillColor:Cesium.Color.RED,outlineColor:Cesium.Color.YELLOW,style:Cesium.LabelStyle.FILL_AND_OUTLINE,verticalOrigin:Cesium.VerticalOrigin.CENTER,horizontalOrigin:Cesium.HorizontalOrigin.CENTER,pixelOffset:new Cesium.Cartesian2(0,0)},show:!1}),f.scene.postRender.addEventListener(function(){H.value=f.scene.canvas.width>600,H.value||(B.value=!1)}),G=new Cesium.LabelCollection({blendOption:Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT}),M.primitives.add(G),T=G.add({show:!1,text:"",horizontalOrigin:Cesium.HorizontalOrigin.CENTER,verticalOrigin:Cesium.VerticalOrigin.BOTTOM,position:Cesium.Cartesian3.fromDegrees(0,0,0),eyeOffset:new Cesium.Cartesian3(0,0,0),scale:.5,pixelOffset:new Cesium.Cartesian2(0,-35),fillColor:Cesium.Color.WHITE,outlineColor:Cesium.Color.BLACK,outlineWidth:2,style:Cesium.LabelStyle.FILL_AND_OUTLINE,disableDepthTestDistance:Number.POSITIVE_INFINITY}),D=document.createElement("canvas"),D.id="windCanvas",D.style="position: absolute;left:0px;top:0px;pointer-events: none;display: block;",document.getElementsByClassName("cesium-widget")[0].appendChild(D),y.initialize(f,D),y.addEventListener("cursorReadoutUpdatedEvent",h=>{const u=h.detail;ie.value=u.showCursorReadout,ee.value=u.cursorReadout,se.value=u.cursorScreenCoords}),y.addEventListener("windUpdatedEvent",async h=>await Ue()),y.addEventListener("forcastTimeChangedEvent",h=>{const u=h.detail;te.value=u.animationTime,F.value=u.selectedTime}),y.addEventListener("timeSeriesLoadedEvent",h=>{const u=h.detail;W.value=u.variables,V.value=u.selectableTimeseries,F.value=u.selectedTime,z.value=u.selectedVariable,R.value=u.colorBar,f.clock.canAnimate=!0,f.clock.shouldAnimate=!1,f.clock.multiplier=1e4}),E=[];const s=Cesium.Rectangle.fromDegrees(-120.064248,25.195292,-61.3849,60.600848);if(Cesium.Camera.DEFAULT_VIEW_RECTANGLE=s,Cesium.Camera.DEFAULT_VIEW_FACTOR=0,!M.screenSpaceCameraController.enableInputs)return;M.camera.flyTo({destination:Cesium.Camera.DEFAULT_VIEW_RECTANGLE,duration:1}),await Ge();var a=new Cesium.ScreenSpaceEventHandler(f.canvas);a.setInputAction(h=>{const u=M.pick(h.position);if(!u){T.show=!1;return}if(!u.primitive){T.show=!1;return}const c=u.primitive;if(!(c instanceof Cesium.Billboard)){T.show=!1;return}const m=c.id;if(!m)return;const g=X(m),d=g.longitude,p=g.latitude,w=g.height+g.bottomHeight;T.position=Cesium.Cartesian3.fromDegrees(d,p,w),T.text=`Power Plant: ${g.properties.Name}
Capacity: ${g.properties.Capacity} MW`,T.show=!0},Cesium.ScreenSpaceEventType.LEFT_DOWN),f.camera.changed.addEventListener(function(){T.show=!1}),a.setInputAction(h=>{const u=M.pick(h.position);if(!u){T.show=!1;return}if(!u.primitive){T.show=!1;return}const c=u.primitive;if(!(c instanceof Cesium.Billboard)){T.show=!1;return}const m=c.id;if(!m)return;X(m).zoomToPOI()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);let n=f.clock.shouldAnimate,l=f.clock.multiplier;f.scene.preRender.addEventListener(()=>{if(!(y!=null&&y.g_windy)||!(y!=null&&y.g_windCanvas))return;var h=Cesium.Cartographic.fromCartesian(f.scene.camera.position);const u=new Cesium.Cartographic(h.longitude,h.latitude,0),c=f.scene.globe.getHeight(u),m=h.height-c;m<_e?(f.clock.multiplier!=1||!f.clock.shouldAnimate)&&(n=f.clock.shouldAnimate,l=f.clock.multiplier,f.clock.shouldAnimate=!0,f.clock.multiplier=1):f.clock.multiplier==1&&(f.clock.multiplier=l,f.clock.shouldAnimate=n),ke(E,m)}),f.geocoder.viewModel.complete.addEventListener(async()=>{const h=f.geocoder.viewModel.searchText,u=f.camera.positionCartographic,c=Cesium.Math.toDegrees(u.longitude),m=Cesium.Math.toDegrees(u.latitude),g=u.height;console.log(`Place: ${h}`),console.log(`Geocoder result: Lon: ${c}, Lat: ${m}, Height: ${g}`)}),f.camera.moveEnd.addEventListener(()=>{N.value&&pe()})}async function Ge(){try{const e=await(await fetch("/assets/geoJSON/USCoalPowerPlants.geojson")).json();e.features&&e.features.forEach(i=>{const t=i.properties,s=tt(t.Plant_Name||"Test",t.Utility_Name,t.Total_MW,100,"red",t.Longitude||0,t.Latitude||0);E.push(s)}),ue.value=E}catch(_){console.error("Error loading GeoJSON:",_)}}function ke(_,e){if(!_)return;_.map(t=>{const s=t.getEmissionPosition(),r=f.camera.positionWC;Cesium.Cartesian3.distance(r,s)<_e?t.showHide(!0):t.showHide(!1)});const i=e<1e4;for(let t=0;t<A.length;t++){let s=A.get(t);s.disableDepthTestDistance=i?0:Number.POSITIVE_INFINITY}}function X(_){for(let e=0;e<E.length;e++){const i=E[e],t=i.properties;if(t&&t.ID&&t.ID===_)return i}}function Ve(_,e){var i;return(i=y.g_windy)==null?void 0:i.getWindAt(_,e)}async function Ue(_){await Promise.all(E.map(async e=>{const i=e.longitude,t=e.latitude,s=Ve(i,t);e.changePrticleCloudSimulationProps({windDirection:s.direction+180,windSpeed:s.speed,emissionSize:9})}))}function He(_){y.showContours(Y.value)}function We(_){y.showGrid(J.value)}function qe(_){y.refreshColorBar(R.value)}function $e(_){y.showWind(U.value)}function je(_){y.show(ae.value)}function Xe(_){y.setLayerAlpha(Number(re.value))}function Ye(_){y.setEnableBilinearSampling(Z.value)}function Je(_){y.setLabelGridCells(Q.value)}function Qe(_){R.value=W.value[z.value].colorbar;for(let e=0;e<R.value.length;e++)R.value[e].mask=!0;y.refreshColorBar(R.value),y.selectVariable(z.value)}function Ze(_){A.show=ce.value}function Ke(_){N.value&&pe(),$.show=N.value}function et(_){E[de.value].zoomToPOI()}function tt(_,e,i,t,s,r,o){const a={type:"Point",coordinates:[r,o,Number(t)]},n=new Pe({point:a,properties:{ID:_,Name:e,Marker:s,Capacity:i,bottomHeight:0},primitiveCollection:oe,particleCollection:ne,billboardCollection:A,chimneyCollection:le,cloudCollection:he,isUserPOI:!0,isSharedPOI:!1,viewer:f});return n||null}Re({setup(){return Me(async()=>{await Oe()}),{g_cesiumViewHeight:I,g_tableHeight:k,g_selectedTime:F,g_selectableTimeseries:V,g_colorBar:R,g_cursorScreenCoords:se,g_cursorReadout:ee,g_animationTime:te,g_showCursorReadout:ie,g_showGrid:J,g_labelGridCells:Q,g_enableBilinearSampling:Z,g_showWindAnimation:U,g_layerAlpha:re,g_cesiumIonToke:De,g_showContours:Y,g_isCursorOnSettings:Ae,g_hoverAbout:q,g_isAboutOn:B,g_isAboutBtnOn:H,g_aboutTooltip:K,g_variables:W,g_selectedVariable:z,g_showWeatherMap:ae,g_showWindAnimation:U,g_showPowerPlants:ce,g_weatherStats:ge,g_unitsLookup:me,g_showWeatherTable:N,g_powerPlantList:ue,g_selectedPowerPlantIndex:de,selectedPowerPlantChanged:et,aboutClick:Fe,mouseOverAbout:Ie,mouseLeaveAbout:ze,showContoursChecked:He,colorChecked:qe,showWindAnimationChecked:$e,showWeatherMapChecked:je,onLayerAlphaChanged:Xe,enableBilinearChecked:Ye,labelGridCellsChecked:Je,showGridChecked:We,selectedVariableChanged:Qe,showPowerPlantsChecked:Ze,showWeatherTableChecked:Ke}}}).mount("#app");
