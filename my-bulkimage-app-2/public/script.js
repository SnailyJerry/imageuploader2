document.getElementById('submitBtn').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const prompt = document.getElementById('prompt').value;
    const files = document.getElementById('files').files;

    if (!apiKey || !prompt || files.length === 0) {
        alert('请填写所有字段并选择图片文件。');
        return;
    }

    const apiUrl = 'https://api.openai.com/v1/images/interpretations';

    // 遍历上传的所有文件
    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('prompt', prompt);

        // 对每张图片发送单独的 API 请求
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('成功:', data);
            if (data && data.data && data.data.length > 0) {
                const interpretation = data.data[0].result;
                alert('图片 ' + (i + 1) + ' 解释结果：' + interpretation);
            } else {
                alert('图片 ' + (i + 1) + ' 解析失败。');
            }
        })
        .catch(error => {
            console.error('错误:', error);
            alert('请求图片 ' + (i + 1) + ' 失败，请检查API密钥或网络连接。');
        });
    }
});
