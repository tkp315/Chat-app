const emailBody=`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Reset some styles */
        body, table, td, a {
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333333;
        }

        /* Container styles */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }

        /* Header styles */
        .email-header {
            text-align: center;
            padding: 10px 0;
            background-color: #4CAF50;
            color: #ffffff;
            font-size: 24px;
        }

        /* Main content styles */
        .email-body {
            background-color: #ffffff;
            padding: 20px;
            margin-top: 10px;
            border: 1px solid #dddddd;
            border-radius: 4px;
        }

        /* Button styles */
        .btn-primary {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            color: #ffffff;
            background-color: #4CAF50;
            text-decoration: none;
            border-radius: 4px;
            text-align: center;
        }

        /* Footer styles */
        .email-footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #999999;
        }

        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                padding: 10px;
            }
            .email-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            Chat App | Believers
        </div>

        <!-- Main Content -->
        <div class="email-body">
            <h2>Hello, {{name}}!</h2>
            <p>Thank you for being a part of our community. We're excited to have you with us.</p>
            <p>Here is a summary of your recent activities:</p>
            <ul>
                <li>Message 1</li>
                <li>Message 2</li>
                <li>Message 3</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email. We're here to help!</p>
            <a href="{{link}}" class="btn-primary">View More Details</a>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            © 2024 Chat App | Believers. All rights reserved.<br>
            <a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a>
        </div>
    </div>
</body>
</html>
`