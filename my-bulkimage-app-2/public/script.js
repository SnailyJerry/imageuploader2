let savedApiKey = '';
let savedModel = 'gpt-4-vision-preview'; // 确保使用支持图像输入的模型
let savedDetail = 'auto';
let savedMaxTokens = 300;

// 处理系统设置按钮的显示与隐藏
document.getElementById('systemSettingsBtn').addEventListener('click', function() {
    const systemSettingsPanel = document.getElementById('systemSettingsPanel');
    // 切换系统设置面板的显示/隐藏
    if (systemSettingsPanel.style.display === 'none' || systemSettingsPanel.style.display === '') {
        systemSettingsPanel.style.display = 'block'; // 显示设置面板
    } else {
        systemSettingsPanel.style.display = 'none'; // 隐藏设置面板
    }
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

        // 显示重新输入 API Key 的按钮
        document.getElementById('reenterApiKey').style.display = 'block';
    }
});

// 重新输入 API Key
document.getElementById('reenterApiKey').addEventListener('click', function() {
    document.getElementById('apiKey').style.display = 'block';
    document.getElementById('saveApiKey').style.display = 'block';
    document.getElementById('apiKeyStatus').style.display = 'none';
    document.getElementById('reenterApiKey').style.display = 'none';
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
            progressContainer.style.display = 'none'; // 隐藏进度条
        }
    };

    const handleApiResponse = (index, type, interpretation) => {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${type} ${index + 1} 结果: ${interpretation}`;
        resultContainer.appendChild(resultElement);
    };

    const sendRequest = (formData, index, type) => {
        console.log(`发送请求: ${type} ${index + 1}`);
        console.log('请求体:', JSON.stringify(formData));

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedApiKey}`,
            },
            body: JSON.stringify(formData)
        })
        .then(async response => {
            console.log(`API 响应状态: ${response.status}`); // 打印响应状态
            const responseData = await response.json();
            console.log('响应数据:', responseData); // 打印响应内容

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status} - ${responseData.error ? responseData.error.message : '未知错误'}`);
            }

            if (responseData.choices && responseData.choices.length > 0) {
                const interpretation = responseData.choices[0].message.content;
                handleApiResponse(index, type, interpretation);
            } else {
                handleApiResponse(index, type, "未返回有效结果");
            }
            updateProgress(); // 更新进度条
        })
        .catch(error => {
            console.error(`请求 ${type} ${index + 1} 出错:`, error.message);
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
                                {"type": "image_url", "image_url": `data:image/jpeg;base64,${base64Image}`},
                                {"type": "text", "text": savedDetail}
                            ]
                        }
                    ]
                };
                sendRequest(formData, i, '图片'); // 调用 sendRequest 函数
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
                            {"type": "image_url", "image_url": imageUrls[j]},
                            {"type": "text", "text": savedDetail}
                        ]
                    }
                ]
            };
            sendRequest(formData, j, '图片链接'); // 调用 sendRequest 函数
        }
    };

    // 处理文件上传和 URL 上传
    if (files.length > 0) {
        processFiles();
    }
    if (imageUrlsInput) {
        processUrls();
    }

    // 如果没有文件和 URL
    if (files.length === 0 && !imageUrlsInput) {
        alert('请上传文件或输入图片 URL');
        progressContainer.style.display = 'none'; // 隐藏进度条
    }
});

// 一键复制结果
document.getElementById('copyResultsBtn').addEventListener('click', function() {
    const resultsText = document.getElementById('resultContainer').textContent;
    navigator.clipboard.writeText(resultsText)
        .then(() => alert('所有结果已复制！'))
        .catch(err => console.error('复制失败: ', err));
});
