import{r as a,j as t,ap as n}from"./index-LYs6tPk6.js";import{R as D}from"./quill.snow-Cz-BQdqh.js";import{b as Q}from"./imageApi-CyCRxD7f.js";import{B as U}from"./Base64ImageWarning-BkFY4anU.js";import{F as A}from"./index-CUS7zVTJ.js";import"./index-BMerVVlW.js";import"./InfoCircleOutlined-hmSwC-tO.js";import"./collapse-BbEVqHco.js";import"./index-B-H-fYnE.js";import"./useMergedState-BIUVHFJD.js";import"./useForm-9sVZBF91.js";import"./row-CKeBPCo0.js";const W=({value:c="",onChange:s,placeholder:R="Nhập nội dung...",height:d=200,readonly:b=!1,productId:y,category:j="product",onImageUpload:h})=>{const[M,H]=a.useState(!1);if(a.useEffect(()=>{const e=i=>{console.error("EnhancedRichTextEditor error:",i),H(!0)};return window.addEventListener("error",e),()=>window.removeEventListener("error",e)},[]),M)return t.jsxs("div",{style:{border:"1px solid #d9d9d9",borderRadius:"6px",padding:"12px",minHeight:`${d}px`,backgroundColor:"#fff2f0",color:"#ff4d4f"},children:[t.jsx("p",{children:"❌ Rich Text Editor gặp lỗi. Đang sử dụng editor đơn giản thay thế."}),t.jsx("textarea",{placeholder:R,value:c,onChange:e=>s==null?void 0:s(e.target.value),style:{width:"100%",minHeight:`${d-60}px`,border:"none",outline:"none",resize:"vertical",fontFamily:"inherit"}})]});const[T,S]=a.useState(c),E=a.useRef(null),[v]=Q(),[u,k]=a.useState(!1);a.useEffect(()=>{S(c)},[c]);const F=e=>{S(e),s&&s(e)},z=a.useCallback(async()=>{if(u){n.warning("Đang upload ảnh, vui lòng chờ...");return}const e=document.createElement("input");e.setAttribute("type","file"),e.setAttribute("accept","image/*"),e.click(),e.onchange=async()=>{var m,x,g,f;const i=(m=e.files)==null?void 0:m[0];if(i){if(i.size>5*1024*1024){n.error("Kích thước ảnh không được vượt quá 5MB");return}if(!i.type.startsWith("image/")){n.error("Chỉ được upload file ảnh");return}k(!0),n.loading("Đang upload ảnh...",0);try{const r=await v({file:i,options:{category:j,productId:y,generateThumbs:!0,optimize:!0}}).unwrap(),p=typeof((x=r==null?void 0:r.data)==null?void 0:x.url)=="string"&&/^https?:\/\//i.test(r.data.url)?r.data.url:`${"http://localhost:8888/api".replace(/\/api\/?$/,"")}${r.data.url}`,l=(g=E.current)==null?void 0:g.getEditor();if(l){const o=l.getSelection(!0);l.insertEmbed(o.index,"image",p),l.setSelection(o.index+1)}h&&h(p,r.data.id),n.destroy(),n.success("Upload ảnh thành công!")}catch(r){n.destroy();const p=((f=r==null?void 0:r.data)==null?void 0:f.message)||"Upload ảnh thất bại";n.error(p),console.error("Image upload error:",r)}finally{k(!1)}}}},[v,j,y,u,h]),$=a.useCallback(async e=>{var x,g,f;const i=e.clipboardData||window.clipboardData,m=i==null?void 0:i.items;if(m)for(let r=0;r<m.length;r++){const p=m[r];if(p.type.startsWith("image/")){e.preventDefault();const l=p.getAsFile();if(!l)continue;if(u){n.warning("Đang upload ảnh, vui lòng chờ...");return}if(l.size>5*1024*1024){n.error("Kích thước ảnh không được vượt quá 5MB");return}k(!0),n.loading("Đang upload ảnh từ clipboard...",0);try{const o=await v({file:l,options:{category:j,productId:y,generateThumbs:!0,optimize:!0}}).unwrap(),w=typeof((x=o==null?void 0:o.data)==null?void 0:x.url)=="string"&&/^https?:\/\//i.test(o.data.url)?o.data.url:`${"http://localhost:8888/api".replace(/\/api\/?$/,"")}${o.data.url}`,q=(g=E.current)==null?void 0:g.getEditor();if(q){const B=q.getSelection(!0);q.insertEmbed(B.index,"image",w),q.setSelection(B.index+1)}h&&h(w,o.data.id),n.destroy(),n.success("Upload ảnh thành công!")}catch(o){n.destroy();const w=((f=o==null?void 0:o.data)==null?void 0:f.message)||"Upload ảnh thất bại";n.error(w),console.error("Image upload error:",o)}finally{k(!1)}break}}},[v,j,y,u,h]),N=a.useMemo(()=>({toolbar:{container:[[{header:[1,2,3,!1]}],["bold","italic","underline","strike"],[{color:[]},{background:[]}],[{list:"ordered"},{list:"bullet"}],[{indent:"-1"},{indent:"+1"}],["link","image"],["clean"]],handlers:{image:z}},clipboard:{matchVisual:!1}}),[z]),L=["header","bold","italic","underline","strike","color","background","list","bullet","indent","link","image"];if(a.useEffect(()=>{var i;const e=(i=E.current)==null?void 0:i.getEditor();if(e&&!b)return e.root.addEventListener("paste",$),()=>{e.root.removeEventListener("paste",$)}},[$,b]),b)return t.jsxs("div",{className:"enhanced-rich-text-editor readonly-mode",children:[t.jsx("div",{className:"ql-editor",dangerouslySetInnerHTML:{__html:T},style:{minHeight:`${d-42}px`,border:"1px solid #ccc",borderRadius:"4px",padding:"12px 15px",backgroundColor:"#f8f9fa"}}),t.jsx("style",{children:`
          .readonly-mode .ql-editor {
            min-height: ${d-42}px;
          }
          .readonly-mode .ql-editor img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .readonly-mode .ql-editor p {
            margin-bottom: 10px;
          }
        `})]});try{return t.jsxs("div",{className:"enhanced-rich-text-editor",children:[t.jsx(D,{ref:E,theme:"snow",value:T,onChange:F,modules:N,formats:L,placeholder:R,readOnly:b||u,style:{height:`${d}px`,marginBottom:"50px"}}),u&&t.jsx("div",{className:"upload-overlay",children:t.jsx("div",{className:"upload-indicator",children:"Đang upload ảnh..."})}),t.jsx("style",{children:`
        .enhanced-rich-text-editor {
          position: relative;
        }
        .enhanced-rich-text-editor .ql-editor {
          min-height: ${d-42}px;
        }
        .enhanced-rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        .enhanced-rich-text-editor .ql-editor img:hover {
          transform: scale(1.02);
        }
        .enhanced-rich-text-editor .ql-editor p {
          margin-bottom: 10px;
        }
        .enhanced-rich-text-editor .ql-editor.ql-blank::before {
          font-style: italic;
          color: #aaa;
        }
        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .upload-indicator {
          background: #1890ff;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `})]})}catch(e){return console.error("ReactQuill render error:",e),t.jsxs("div",{style:{border:"1px solid #d9d9d9",borderRadius:"6px",padding:"12px",minHeight:`${d}px`,backgroundColor:"#fff2f0",color:"#ff4d4f"},children:[t.jsx("p",{children:"❌ Rich Text Editor gặp lỗi khi render. Đang sử dụng editor đơn giản thay thế."}),t.jsx("textarea",{placeholder:R,value:c,onChange:i=>s==null?void 0:s(i.target.value),style:{width:"100%",minHeight:`${d-60}px`,border:"none",outline:"none",resize:"vertical",fontFamily:"inherit"}})]})}},ee=()=>{const[c]=A.useForm();return t.jsxs("div",{style:{padding:"20px"},children:[t.jsx("h1",{children:"Test Components"}),t.jsx("h2",{children:"EnhancedRichTextEditor"}),t.jsx(A,{form:c,children:t.jsx(A.Item,{name:"description",children:t.jsx(W,{placeholder:"Test editor...",height:200,category:"product"})})}),t.jsx("h2",{children:"Base64ImageWarning"}),t.jsx(U,{description:"<img src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...' />"})]})};export{ee as default};
