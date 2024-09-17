let savedApiKey = '';
let savedModel = 'gpt-4o-mini';
let savedDetail = 'auto';
let savedMaxTokens = 300;

// 处理系统设置按钮的显示与隐藏
document.getElementById('systemSettingsBtn').addEventListener('click', function() {
    const systemSettingsPanel = document.getElementById('systemSettingsPanel');
    systemSettingsPanel.style.display = systemSettingsPanel.style.display === 'none' ? 'block' : 'none';
});

// 保存 API Key 和系统设置
document.getElementById('saveApiKey').addEventListener('click', function() {
    const apiKeyInput = document.getElementById('apiKey');
    savedApiKey = apiKeyInput.value;

    if (savedApiKey) {
        apiKeyInput.value = ''; // 清空输入框
        apiKeyInput.style.display = 'none'; // 隐藏 API Key 输入框
        document.getElementById('saveApiKey').style.display = 'none'; // 隐藏保存按钮
        document.getElementById('apiKeyStatus').style.display = 'block'; // 显示已保存提示
    }
});

document.getElementById('saveSettings').addEventListener('click', function() {
    savedModel = document.getElementById('modelSelect').value;
    savedDetail = document.getElementById('detailSelect').value;
    savedMaxTokens = document.getElementById('maxTokens').value;
    alert('系统设置已保存！');
});

document.getElementById('submitBtn').addEventListener('click', function() {
    const prompt = document.getElementById('prompt').value;
    const files = document.getElementById('files').files;
    const imageUrlsInput = document.getElementById('imageUrls').value.trim();

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = ''; // 清空之前的结果

    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block'; // 显示进度条
    progressBar.value = 0; // 重置进度条

    let totalTasks = files.length + (imageUrlsInput ? imageUrlsInput.split(' ').length : 0);
    let completedTasks = 0;

    const updateProgress = () => {
        completedTasks++;
        let progressPercentage = (completedTasks / totalTasks) * 100;
        progressBar.value = progressPercentage;

        if (completedTasks === totalTasks) {
            document.getElementById('progressText').textContent = '处理完成！';
        }
    };

    const handleApiResponse = (index, type, interpretation) => {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${type} ${index + 1} 结果: ${interpretation}`;
        resultContainer.appendChild(resultElement);
    };

    const sendRequest = (formData, index, type) => {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedApiKey}`,
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.choices && data.choices.length > 0) {
                const interpretation = data.choices[0].message.content;
                handleApiResponse(index, type, interpretation);
            } else {
                handleApiResponse(index, type, "未返回有效结果");
            }
            updateProgress(); // 更新进度条
        })
        .catch(error => {
            handleApiResponse(index, type, `错误: ${error.message}`);
            updateProgress();
        });
    };

    const processFiles = () => {
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.readAsDataURL(files[i]);

            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];
                const formData = {
                    "model": savedModel,
                    "max_tokens": parseInt(savedMaxTokens),
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` }},
                                {"type": "detail", "detail": savedDetail}
                            ]
                        }
                    ]
                };
                sendRequest(formData, i, '图片');
            };
        }
    };

    const processUrls = () => {
        const imageUrls = imageUrlsInput.split(' ');
        for (let j = 0; j < imageUrls.length; j++) {
            const formData = {
                "model": savedModel,
                "max_tokens": parseInt(savedMaxTokens),
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": { "url": imageUrls[j] }},
                            {"type": "detail", "detail": savedDetail}
                        ]
                    }
                ]
            };
            sendRequest(formData, j, '图片链接');
        }
    };

    // 处理文件上传和 URL 上传
    if (files.length > 0) {
        processFiles();
    }
    if (imageUrlsInput) {
        processUrls();
    }
});

// 一键复制结果
document.getElementById('copyResultsBtn').addEventListener('click', function() {
    const resultsText = document.getElementById('resultContainer').textContent;
    navigator.clipboard.writeText(resultsText)
        .then(() => alert('所有结果已复制！'))
        .catch(err => console.error('复制失败: ', err));
});
