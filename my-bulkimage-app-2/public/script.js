document.getElementById('submitBtn').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const prompt = document.getElementById('prompt').value;
    const files = document.getElementById('files').files;
    const imageUrlsInput = document.getElementById('imageUrls').value.trim();
    
    // 检查是否输入了 API Key 和提示词
    if (!apiKey || !prompt) {
        alert('请填写API密钥和提示词。');
        return;
    }

    // 检查文件和URL都没有输入的情况
    if (files.length === 0 && !imageUrlsInput) {
        alert('请上传图片文件或输入图片URL链接。');
        return;
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    // 如果上传了图片文件，遍历上传的所有文件
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.readAsDataURL(files[i]);

            reader.onload = function () {
                const base64Image = reader.result.split(',')[1]; // 获取 base64 数据

                const formData = {
                    "model": "gpt-4o-mini", // 根据需要调整模型名称
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` }}
                            ]
                        }
                    ]
                };

                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.choices && data.choices.length > 0) {
                        const interpretation = data.choices[0].message.content;
                        alert('图片 ' + (i + 1) + ' 解析结果：' + interpretation);
                    } else {
                        alert('图片 ' + (i + 1) + ' 解析失败。');
                    }
                })
                .catch(error => {
                    console.error('错误:', error);
                    alert('请求图片 ' + (i + 1) + ' 失败，请检查API密钥或网络连接。');
                });
            };
        }
    }

    // 如果输入了图片URL，处理这些链接
    if (imageUrlsInput) {
        const imageUrls = imageUrlsInput.split(' '); // 用空格分隔URL
        for (let j = 0; j < imageUrls.length; j++) {
            const formData = {
                "model": "gpt-4o-mini", // 根据需要调整模型名称
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": { "url": imageUrls[j] }}
                        ]
                    }
                ]
            };

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data && data.choices && data.choices.length > 0) {
                    const interpretation = data.choices[0].message.content;
                    alert('图片链接 ' + (j + 1) + ' 解析结果：' + interpretation);
                } else {
                    alert('图片链接 ' + (j + 1) + ' 解析失败。');
                }
            })
            .catch(error => {
                console.error('错误:', error);
                alert('请求图片链接 ' + (j + 1) + ' 失败，请检查API密钥或网络连接。');
            });
        }
    }
});
