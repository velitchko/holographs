import json
import statistics

from PySide6.QtWidgets import (
    QMainWindow,
    QApplication,
    
)
from PySide6.QtCore import Qt, Slot, QStandardPaths, QPointF
from PySide6.QtGui import (
    QImage,
    QPainter,
    QBrush,
    QPen,
    QTransform,
    QColor,
    QFont

    
)
import sys, os
def mapInterval(x, x_min, x_max, max,min):
    return min + (max-min)*((x-x_min)/(x_max-x_min))

def getNodeColors(path, colors, highlighted = []):

    nodes = {}
    i = 0
    
    for fn in os.listdir(path):
        with open(path+fn, "r") as read_file:
            data = json.load(read_file)
        for node in data['nodes']:
            if not nodes.keys().__contains__(node['id']):
                if(node['id'] in highlighted or len(highlighted) == 0):
                    nodes[node['id']] = colors[i]
                    i +=1
                    if(i >= len(colors)):i=0
                else:
                    nodes[node['id']] = '#000000'
    return nodes





class MainWindow(QMainWindow):        
    def __init__(self, parent=None):
        QMainWindow.__init__(self, parent)

        self.min_line_width = 1
        self.max_line_width = 10
        self.min_v = 0.8
        self.max_v = 0.2

        self.drawStuff()
        exit()
    # white
    def getLineOverlay(self,path,  width, height, margin_x, margin_y, node_colors, highlight = []):    

        graph_x_min = self.graph_x_min
        graph_x_max = self.graph_x_max
        graph_y_min = self.graph_y_min
        graph_y_max = self.graph_y_max

        centrality_min = self.centrality_min
        centrality_max = self.centrality_max

        edge_weight_min = self.edge_weight_min
        edge_weight_max = self.edge_weight_max
    
        line_width= 50

        img_x_min = margin_x
        img_x_max =  width - margin_x

        img_y_min = margin_y
        img_y_max =  height - margin_y

        img = QImage(width,height,QImage.Format.Format_ARGB32)
        painter = QPainter()
        painter.begin(img)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setBrush(Qt.GlobalColor.white)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(0,0,width,height)
        line_pen = QPen()
        # line_pen.setColor(QColor(0x66, 0x66, 0x66, 0x40))
        line_pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        line_pen.setWidth(line_width)
        line_pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
        text_pen = QPen(QColor(Qt.GlobalColor.black))
        circle_pen = QPen(QColor("#FFFFFF"))
        line_brush = QBrush(QColor("#FFFFFF"))
        
        painter.setFont(QFont("Helvetica", 20))
        # pen.set
        

        cps = {}
        lcps = {}

        for fn in os.listdir(path):        
            with open(path + fn, "r") as read_file:
                data = json.load(read_file)
                for node in data['nodes']:
                    node_id = node['id']
                    if(cps.keys().__contains__(node_id)):
                        cps[node_id].append([node['x'], node['y'],node['name']])
                        lcps[node_id].append(QPointF(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min), mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min)))
                    else:
                        cps[node_id] = [[node['x'], node['y'],node['name']]]
                        lcps[node_id]= [QPointF(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min), mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min))]

        painter.setOpacity(0.5)
        for node_id in lcps.keys():
                if(node_id in highlight or len(highlight) == 0):
                    line_pen.setColor(QColor(node_colors[node_id]))
                    painter.setPen(line_pen)            

                    painter.drawPolyline(lcps[node_id])

                    painter.setPen(circle_pen)
                    painter.setBrush(line_brush)

                    for point in lcps[node_id]:
                        painter.drawEllipse(point, line_width/2,line_width/2)
            
        painter.end()
        return img

    def getLableOverlay(self, path,  width, height, margin_x, margin_y, node_colors, highlight = []):    

        graph_x_min = self.graph_x_min
        graph_x_max = self.graph_x_max
        graph_y_min = self.graph_y_min
        graph_y_max = self.graph_y_max

        centrality_min = self.centrality_min
        centrality_max = self.centrality_max

        edge_weight_min = self.edge_weight_min
        edge_weight_max = self.edge_weight_max
    
        line_width= 50

        img_x_min = margin_x
        img_x_max =  width - margin_x

        img_y_min = margin_y
        img_y_max =  height - margin_y

        img = QImage(width,height,QImage.Format.Format_ARGB32)
        painter = QPainter()
        painter.begin(img)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setBrush(Qt.GlobalColor.white)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(0,0,width,height)
        line_pen = QPen()
        # line_pen.setColor(QColor(0x66, 0x66, 0x66, 0x40))
        line_pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        line_pen.setWidth(line_width)
        line_pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
        text_pen = QPen(QColor(Qt.GlobalColor.black))
        circle_pen = QPen(QColor("#FFFFFF"))
        line_brush = QBrush(QColor("#FFFFFF"))
        
        painter.setFont(QFont("Helvetica", 20))
        # pen.set
        

        cps = {}
        lcps = {}

        for fn in os.listdir(path):        
            with open(path + fn, "r") as read_file:
                data = json.load(read_file)
                for node in data['nodes']:
                    node_id = node['id']
                    if(cps.keys().__contains__(node_id)):
                        cps[node_id].append([node['x'], node['y'],node['name']])
                        lcps[node_id].append(QPointF(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min), mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min)))
                    else:
                        cps[node_id] = [[node['x'], node['y'],node['name']]]
                        lcps[node_id]= [QPointF(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min), mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min))]

        for node_id in cps.keys():
            if(len(cps[node_id])>1):
                for i in range(1,len(cps[node_id])):
                    line_pen.setColor(QColor(node_colors[node_id]))
                    painter.setPen(line_pen)            
                    painter.setOpacity(0.5)
                    # painter.drawLine(mapInterval(cps[node_id][i-1][0], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(cps[node_id][i-1][1], graph_y_min,graph_y_max,img_y_max,img_y_min),mapInterval(cps[node_id][i][0], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(cps[node_id][i][1], graph_y_min,graph_y_max,img_y_max,img_y_min))

                    
                text_pen.setColor(node_colors[node_id])    
                painter.setPen(text_pen)            
                painter.setOpacity(1)
                if(node_id in highlight or len(highlight) == 0):
                    
                    text_pen.setColor('#666666')    
                    painter.setPen(text_pen)            
                    painter.drawText(mapInterval(cps[node_id][i][0], graph_x_min,graph_x_max,img_x_max,img_x_min) + 1,mapInterval(cps[node_id][i][1], graph_y_min,graph_y_max,img_y_max,img_y_min)+ 1,cps[node_id][i][2])   
                    text_pen.setColor(node_colors[node_id])    
                    painter.setPen(text_pen)                
                    painter.drawText(mapInterval(cps[node_id][i][0], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(cps[node_id][i][1], graph_y_min,graph_y_max,img_y_max,img_y_min),cps[node_id][i][2])   

        
        painter.end()
        return img

    def getTimesliceOverlay(self, path, width, height, margin_x, margin_y, node_colors, highlight = [],node_radius = 20, edge_thickness = 1, edge_color='#666666',node_color='#666666', edge_weight_to_node_col = False, edge_weight_to_node_thickness = True, centrality_to_node_diam = False):

        graph_x_min = self.graph_x_min
        graph_x_max = self.graph_x_max
        graph_y_min = self.graph_y_min
        graph_y_max = self.graph_y_max

        centrality_min = self.centrality_min
        centrality_max = self.centrality_max

        edge_weight_min = self.edge_weight_min
        edge_weight_max = self.edge_weight_max

        with open(path, "r") as read_file:
            data = json.load(read_file)

        img_x_min = margin_x
        img_x_max =  width - margin_x

        img_y_min = margin_y
        img_y_max =  height - margin_y
        

        img = QImage(width,height,QImage.Format.Format_ARGB32)


        # white

        painter = QPainter()
        painter.begin(img)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setBrush(Qt.GlobalColor.white)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(0,0,width,height)
        line_pen = QPen()
        edge_color = QColor(edge_color)
        line_pen.setColor(edge_color)
        line_pen.setWidth(3)
        node_pen = QPen(QColor(node_color))
        # node_pen.setColor(QColor(0x66, 0x66, 0x66, 0xCC))
        painter.setPen(line_pen)
        # line_pen.setColor(QColor(0x66, 0x66, 0x66, 0x40))
        # painter.drawRect(img_x_min,img_y_min,img_x_max-margin_x,img_y_max-margin_y)

        # print(img_x_max,img_x_min,img_y_max,img_y_min)

        for edge in data['edges']:            
            
            if(edge_weight_to_node_col):
                edge_color.setHsvF( 1, 0, mapInterval(edge['weight'],self.edge_weight_min, self.edge_weight_max, self.max_v, self.min_v),  1)
                line_pen.setColor(edge_color)     
            if(edge_weight_to_node_thickness):
                line_pen.setWidth(mapInterval(edge['weight'],self.edge_weight_min, self.edge_weight_max, self.max_line_width, self.min_line_width))
            painter.setPen(line_pen)
            painter.setOpacity(1)
            if((edge['source']['id'] in highlight and edge['target']['id'] in highlight)):
                painter.drawLine(mapInterval(edge['source']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(edge['source']['y'], graph_y_min,graph_y_max,img_y_max,img_y_min),mapInterval(edge['target']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(edge['target']['y'], graph_y_min,graph_y_max,img_y_max,img_y_min))
            # painter.drawLine(edge['source']['x'],edge['source']['y'],edge['target']['x'],edge['target']['y'])
            # print(edge['source']['x'],edge['source']['y'],edge['target']['x'],edge['target']['y'])
            # print(mapInterval(edge['source']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min))
        for node in data['nodes']:
            # node_pen.setColor(QColor(node_colors[node['id']]))
            # painter.setBrush(QColor(node_colors[node['id']]))

            painter.setBrush(QColor(node_colors[node['id']]))
            node_pen.setColor(QColor(node_colors[node['id']]))
            painter.setPen(node_pen)
            if(node['id'] in highlight):
                painter.drawEllipse(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min)- node_radius,mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min)-node_radius, 2*node_radius, 2*node_radius)

            # painter.drawText(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min), node['name'])
            # print(node['name'])
            
        painter.end()
        return img

    def getImg(self, path, width, height, margin_x, margin_y, node_colors, highlight = [], node_radius = 15, edge_thickness = 3, edge_color='#cccccc',node_color='#cccccc', edge_weight_to_node_col = False, edge_weight_to_node_thickness = True, centrality_to_node_diam = False):
        graph_x_min = self.graph_x_min
        graph_x_max = self.graph_x_max
        graph_y_min = self.graph_y_min
        graph_y_max = self.graph_y_max

        centrality_min = self.centrality_min
        centrality_max = self.centrality_max

        edge_weight_min = self.edge_weight_min
        edge_weight_max = self.edge_weight_max

        with open(path, "r") as read_file:
            data = json.load(read_file)

        img_x_min = margin_x
        img_x_max =  width - margin_x

        img_y_min = margin_y
        img_y_max =  height - margin_y
        

        img = QImage(width,height,QImage.Format.Format_ARGB32)
        


        # white

        painter = QPainter()
        painter.begin(img)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setBrush(Qt.GlobalColor.white)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(0,0,width,height)
        line_pen = QPen()
        edge_color = QColor(edge_color)
        line_pen.setColor(edge_color)
        line_pen.setWidth(edge_thickness)
        node_pen = QPen(QColor(node_color))
        # node_pen.setColor(QColor(0x66, 0x66, 0x66, 0xCC))
        painter.setPen(line_pen)
        # line_pen.setColor(QColor(0x66, 0x66, 0x66, 0x40))
        # painter.drawRect(img_x_min,img_y_min,img_x_max-margin_x,img_y_max-margin_y)

        # print(img_x_max,img_x_min,img_y_max,img_y_min)

        for edge in data['edges']:

            if(edge_weight_to_node_col):
                edge_color.setHsvF( 1, 0, mapInterval(edge['weight'],self.edge_weight_min, self.edge_weight_max, self.max_v, self.min_v),  1)
                line_pen.setColor(edge_color)     
            if(edge_weight_to_node_thickness):
                line_pen.setWidth(mapInterval(edge['weight'],self.edge_weight_min, self.edge_weight_max, self.max_line_width, self.min_line_width))
            painter.setPen(line_pen)

            if(not (edge['source']['id'] in highlight and edge['target']['id'] in highlight)):
                painter.drawLine(mapInterval(edge['source']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(edge['source']['y'], graph_y_min,graph_y_max,img_y_max,img_y_min),mapInterval(edge['target']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(edge['target']['y'], graph_y_min,graph_y_max,img_y_max,img_y_min))
            # painter.drawLine(edge['source']['x'],edge['source']['y'],edge['target']['x'],edge['target']['y'])
            # print(edge['source']['x'],edge['source']['y'],edge['target']['x'],edge['target']['y'])
            # print(mapInterval(edge['source']['x'], graph_x_min,graph_x_max,img_x_max,img_x_min))
        for node in data['nodes']:
            # node_pen.setColor(QColor(node_colors[node['id']]))
            # painter.setBrush(QColor(node_colors[node['id']]))

            painter.setBrush(QColor(QColor(node_color)))
            # node_pen.setColor(QColor(node_colors[node['id']]))
            painter.setPen(node_pen)
            if(not node['id'] in highlight):
                painter.drawEllipse(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min)- node_radius,mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min)-node_radius, 2*node_radius, 2*node_radius)

            # painter.drawText(mapInterval(node['x'], graph_x_min,graph_x_max,img_x_max,img_x_min),mapInterval(node['y'], graph_y_min,graph_y_max,img_y_max,img_y_min), node['name'])
            # print(node['name'])
            
        painter.end()
        return img

    def drawStuff(self):
        
        dev = self

        self.stats = {}

        colors = ['#5778a4','#e49444','#d1615d','#85b6b2','#6a9f58','#e7ca60','#a87c9f','#f1a2a9','#967662','#b8b0ac']


        path = "Data/HP/v2/"
        
        self.graph_x_min = float('inf')
        self.graph_x_max = float('-inf')
        self.graph_y_min = float('inf')
        self.graph_y_max = float('-inf')
        self.centrality_min = float('inf')
        self.centrality_max = float('-inf')
        self.edge_weight_min = float('inf')
        self.edge_weight_max = float('-inf')
        for fn in os.listdir(path):
            [curr_x_min, curr_x_max,curr_y_min,curr_y_max, curr_centrality_min, curr_centrality_max, curr_edge_weight_min, curr_edge_weight_max,cents] = dev.getDataMinMax(path+fn)

            for node_id in cents.keys():
                if(node_id in self.stats.keys()):
                    self.stats[node_id].append(cents[node_id])
                else:
                    self.stats[node_id] = [cents[node_id]]
                    

            if(curr_x_min < self.graph_x_min):self.graph_x_min = curr_x_min
            if(curr_x_max > self.graph_x_max):self.graph_x_max = curr_x_max
            if(curr_y_min < self.graph_y_min):self.graph_y_min = curr_y_min
            if(curr_y_max > self.graph_y_max):self.graph_y_max = curr_y_max

            if(curr_centrality_min < self.centrality_min):self.centrality_min = curr_centrality_min
            if(curr_centrality_max > self.centrality_max):self.centrality_max = curr_centrality_max
            if(curr_edge_weight_min < self.edge_weight_min):self.edge_weight_min = curr_edge_weight_min
            if(curr_edge_weight_max > self.edge_weight_max):self.edge_weight_max = curr_edge_weight_max

        meds = {}

        for node_id in self.stats.keys():
            if(len(self.stats[node_id]) == 7): meds[node_id] =  statistics.median(self.stats[node_id])

        meds =sorted(meds.items(), key=lambda item: item[1],reverse=True)
        print(meds)
        ranks = [x[0] for x in meds]
        highlight_nodes = ranks[0:10]
        print(len(highlight_nodes), highlight_nodes)
        node_colors = getNodeColors(path, colors, highlight_nodes)

        for node in highlight_nodes:
            print(node_colors[node])
        ppmm = 10
        height = 148 * ppmm
        width = 210 * ppmm

        margin_x = 20 * ppmm
        margin_y = 10 * ppmm
        imgs = []
        ols = []
        for fn in os.listdir(path):
            img = self.getImg(path + fn,width, height, margin_x, margin_y,node_colors, highlight_nodes)
            ol = self.getTimesliceOverlay(path + fn, width, height, margin_x, margin_y,node_colors, highlight_nodes)
            # print (fn)
            # img.save( fn.split('.')[0]+ "test.png")
            imgs.append(img)
            imgs.append(ol)
        img = self.getLineOverlay(path, width, height, margin_x, margin_y,node_colors,highlight_nodes)
        imgs.append(img)
        img = self.getLableOverlay(path, width, height, margin_x, margin_y,node_colors,highlight_nodes)
        imgs.append(img)
        rotate = QTransform()
        # rotate.rotate(180)
        rotate.rotate(0)
        pg = 1
        for i in range (0,len(imgs)):
            if i % 2 == 0:            
                page = QImage(width,height * 2,QImage.Format.Format_ARGB32)
                painter = QPainter()
                painter.begin(page)
                painter.drawImage(0,0,imgs[i])
                painter.drawText(margin_x,margin_y,str(pg))   

                painter.end()
            else:
                painter = QPainter()
                painter.begin(page)

                labeller = QPainter()
                labeller.begin(imgs[i])
                labeller.drawText(margin_x,margin_y,str(pg))

                labeller.end()
                painter.drawImage(0,height,imgs[i].transformed(rotate))
                
                painter.setPen(Qt.GlobalColor.black)
                painter.drawLine(0,1,width,1)
                painter.drawLine(0,height,width,height)
                painter.drawLine(0,2*height -1 ,width,2*height -1)
                painter.end()
                page.save("page_"+str(pg)+".png")
                pg += 1
    
    def getDataMinMax(self, path):    

        cents = {}

        with open(path, "r") as read_file:
            data = json.load(read_file)

        graph_x_min = float('inf')
        graph_x_max = float('-inf')
        graph_y_min = float('inf')
        graph_y_max = float('-inf')

        centrality_min = float('inf')
        centrality_max = float('-inf')

        edge_weight_min = float('inf')
        edge_weight_max = float('-inf')


        for node in data['nodes']:
            cents[node['id']] = node['centrality']

            if node['x']<self.graph_x_min: self.graph_x_min = node['x']
            if node['x']>self.graph_x_max: self.graph_x_max = node['x']
            if node['y']<self.graph_y_min: self.graph_y_min = node['y']
            if node['y']>self.graph_y_max: self.graph_y_max = node['y']
            
            if node['centrality']>self.centrality_max: self.centrality_max = node['centrality']
            if node['centrality']<self.centrality_min: self.centrality_min = node['centrality']


        for edge in data['edges']:
            if edge['weight']>self.edge_weight_max: self.edge_weight_max = edge['weight']
            if edge['weight']<self.edge_weight_min: self.edge_weight_min = edge['weight']

        return [graph_x_min, graph_x_max, graph_y_min, graph_y_max, centrality_min, centrality_max, edge_weight_min, edge_weight_max, cents]

if __name__ == "__main__":

    app = QApplication(sys.argv)

    w = MainWindow()
    w.show()
    sys.exit(app.exec())