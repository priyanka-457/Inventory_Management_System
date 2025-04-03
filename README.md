README.md

# ==============================================
# Full-Stack Inventory Management System Launcher
# ==============================================

# 1. open the project directory
cd manager     

# 2. Create project structure
mkdir -p backend/{config,controllers,models,routes} frontend/{css,js}

#3.setup backend             
 npm init -y                                                                                       
                                                           
# 4. Install backend dependencies
npm install express mongoose dotenv cors body-parser

# 5. Set up environment variables
MONGODB_URI=mongodb://localhost:27017/inventoryDB
PORT=5000

# 6. Run the Application:
node server.js 

#7.Access the application:
http://localhost:5000

User Interface: A web dashboard displays inventory items, analytics, and alerts in real-time.
Data Input: Users add/edit products through forms with automatic validation (e.g., no negative prices).
Live Search: Typing in the search bar instantly filters the item table by name/category.
Automated Alerts: Items below the set threshold turn red and appear in a "Low Stock" section.
Dynamic Charts: Pie/bar charts update automatically when data changes, showing trends.
Real-Time Sync: Frontend fetches updates every 30 seconds or after user actions.
for further check our link        


Demo of the Project       
https://drive.google.com/file/d/1Wh-ej0Z-4IgmOQwj7rvh_9sKJcyKVLjz/view?usp=sharing
