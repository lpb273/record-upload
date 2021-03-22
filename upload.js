const chunkSize = 2 * 1024 *1024;
const uploadFile = {
  chunkSize: chunkSize,
  chunkList: [],
  file: null,
  fileHash: ''
};
const fileUploadStatus = {
  'pending': 'pending',
  'success': 'success',
  'fail': 'fail'
}
const uploadUrl = '';
const mergeUrl = '';
const token = '';
const retryMax = 5;
const tempThreads = 6;
const contentType = 'application/x-www-form-urlencoded';

function handleFileChange () {
  let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        file = this.files[0],
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer(),
        fileReader = new FileReader();
    uploadFile.file = this.files[0];
    fileReader.onload = function (e) {
      // console.warn('read chunk nr', currentChunk + 1, 'of', chunks, );
      createFileChunk(spark.end(), e.target.result);
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNext();
      } else {
        uploadFile.fileHash = spark.end();
        uploadFileChunks();
        // console.warn('computed hash', spark.end());
      }
    };
        
    fileReader.onerror = function () {
      console.warn('oops, something went wrong.');
    };

    function loadNext() {
      let start = currentChunk * chunkSize;
      let end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }
    loadNext();
}
/**
 * 创建切片保存到uploadFile.chunkList
 * @function createFileChunk
 * @param {String} hash
 * @param {Object} hashFile
*/

function createFileChunk(hash, hashFile) {
  uploadFile.chunkList.push({
    index: uploadFile.chunkList.length,
    hash: hash,
    file: hashFile,
    status: fileUploadStatus.pending //pending,uploading,success,fail
  });
  // console.log('uploadFile -> uploadFile', uploadFile);
  return uploadFile;
}

/**
 * 上传切片文件
 * @function uploadFileChunks
*/
function uploadFileChunks() {
  const chunkData = uploadFile.chunkList;
  const fileName = uploadFile.file.name;
  return new Promise(async (resolve, reject) => {
    const requestDataList = chunkData.map(({index, hash, file}) => {
      const formData = new FormData();
      formData.append('md5', hash);
      formData.append('file', file);
      formData.append('index', index);
      return { formData, index, fileName };
    });
    console.warn('requestDataList', requestDataList);
    try {
      const result = await sendRequest(requestDataList);
      console.warn(result);
    } catch (error) {
      console.warn(error);
      throw new Error(error);
    }
  });
}
/**
 * 发送上传请求
 * @function sendRequest
 * @param {Object} forms
 * 
*/
function sendRequest(forms) {
  console.warn('发送上传请求', forms, forms.length)
  let finished = 0;
  const total = forms.length;
  return new Promise((resolve, reject) => {
    const handler = () => {
      if(forms.length) {
        const formInfo = forms.shift();
        const formData = formInfo.file;
        const index = formInfo.index;
        console.warn(formInfo, formData, index);
        fetchHttp(formData).then(res => {
          console.warn(`上传成功chunk${formInfo.hash}`,res);
          uploadFile.chunkList[index].status = fileUploadStatus.success;
          finished ++;
          addChunkLocalStorage();
          handler();
        })
        .catch(err => {
          console.warn('出现错误', err);
          uploadFile.chunkList[index].status = fileUploadStatus.fail;
          retry(fetchHttp.bind(formData), retryMax);
          // forms.push(formInfo);
          // handler();
        })
      }
      if (finished >= total) {
        resolve('done');
      }
    }
    for(let i = 0;i < tempThreads;i ++) {
      handler();
    }
  })
}

/**
 * @function fetchHttp
 * @param {String} url
 * @param {String} type
 * @param {Object} data
*/
function fetchHttp(url = uploadUrl, type = contentType, data) {
  console.warn('fetchHttp', url, type, data)
  return fetch(url, {
    headers: {
      'token': token,
      'content-type': type,
    },
    body: data,
    method: 'POST',
  })
  .then(function(response) {
    return response.json();
  })
  .catch(function(error) {
    return error;
  });
}

function addChunkLocalStorage() {
  localStorage.setItem('uploadFile', JSON.stringify(uploadFile));
}

function clearChunkLocalStorage() {
  localStorage.removeItem('uploadFile');
}

/**
 * @function retry
 * @param {Function} fn
 * @param {Number} maxNum
*/
function retry(fn, maxNum) {
  return new Promise((resolve, reject) => {
    function send() {
      fn().then(res => {
        console.warn('retry', res);
      })
      .catch(err => {
        if(maxNum === 0) reject(err);
        maxNum --;
        send();
      })
    }
    send();
  })
}

function mergeRequest(data) {
  fetchHttp(mergeUrl, 'application/json', data)
  .then(res => {
    console.warn(res);
    clearChunkLocalStorage();
  })
  .catch(err => {
    console.warn(err);
  })
}

function isAllStatus() {
  const flag = uploadFile.chunkList.every((item) => {
    Object.keys(fileUploadStatus).includes(item.status);
  });
  if(flag) {
    console.warn('上传完成');
  }
}