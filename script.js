document.addEventListener('DOMContentLoaded', function() {
    const uvValueElement = document.getElementById('uv-value');
    const progressBar = document.getElementById('progress-bar');
    const locationSelect = document.getElementById('location-select');

    // Update the UV index value and progress bar
    function updateUVIndex(value) {
        uvValueElement.textContent = value;
        const percentage = ((value - 1) / (13 - 1)) * 100; // Scale UV index to percentage
        progressBar.style.width = `${percentage}%`;

        // Change progress bar color from blue to red based on UV index
        const red = Math.min(255, Math.floor((value / 13) * 255));
        const blue = 255 - red;
        progressBar.style.backgroundColor = `rgb(${red}, 0, ${blue})`;
    }

    // Function to fetch UV index data based on location
    function fetchUVIndex() {
        const location = locationSelect.value;
        let uvIndex;
        switch (location) {
            case 'Boa Viagem, Ceará':
                uvIndex = 10;
                break;
            case 'Canindé, Ceará':
                uvIndex = 8;
                break;
            case 'Fortaleza, Ceará':
                uvIndex = 11;
                break;
            default:
                uvIndex = 10;
        }
        updateUVIndex(uvIndex);
    }

    // Fetch UV index data when the page loads
    fetchUVIndex();

    // Initialize Chart.js
    const ctx = document.getElementById('uvChart').getContext('2d');
    const uvChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Índice UV',
                data: [5, 8, 8, 9, 8, 11, 8],
                borderColor: '#ffab00',
                backgroundColor: 'rgba(255, 171, 0, 0.2)',
                fill: true,
                lineTension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1,
                    max: 13
                }
            }
        }
    });
});
