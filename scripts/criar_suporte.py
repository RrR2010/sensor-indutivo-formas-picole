"""Run after criar_sensor.py; adds a continuous bent bracket to the sensor scene."""
import bpy
import bmesh
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'Modelos', 'Sensor_indutivo_M18')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'sensor_indutivo_M18.blend'))
for name in ['Fixacao', 'Conjunto_Sensor_M18']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)
old = bpy.data.collections.get('Suporte_e_Porcas')
if old:
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(old)
collection = bpy.data.collections.new('Suporte_e_Porcas')
bpy.context.scene.collection.children.link(collection)
mat = bpy.data.materials.get('Metal_Fixacao') or bpy.data.materials.new('Metal_Fixacao')
mat.use_nodes = True
mat.diffuse_color = (.45, .48, .5, 1)
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = mat.diffuse_color
bsdf.inputs['Metallic'].default_value = .75
bsdf.inputs['Roughness'].default_value = .38

def mesh_obj(name, vertices, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def apply(obj, mod):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)

def drill(obj, radius, depth, location, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth, location=location, rotation=rotation)
    cutter = bpy.context.object
    mod = obj.modifiers.new('Furo_passante', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = cutter
    apply(obj, mod)
    bpy.data.objects.remove(cutter, do_unlink=True)

def bevel(obj, width):
    mod = obj.modifiers.new('Acabamento_arestas', 'BEVEL')
    mod.width = width
    mod.segments = 2
    apply(obj, mod)

# Millimetres. Rear wall and shelf occupy the XZ profile. The foot leaves
# a SIDE edge of the shelf along +Y, perpendicular to that profile.
corners = [(-27,70),(-27,47),(-18,39),(-18,16),(17,16)]
path = [Vector(corners[0])]
for i in range(1,len(corners)-1):
    prev, cur, nxt = map(Vector, (corners[i-1],corners[i],corners[i+1]))
    d = min(2.8, (prev-cur).length*.25, (nxt-cur).length*.25)
    a = cur+(prev-cur).normalized()*d
    b = cur+(nxt-cur).normalized()*d
    path.append(a)
    for j in range(1,9):
        t = j/8
        path.append((1-t)**2*a+2*(1-t)*t*cur+t*t*b)
path.append(Vector(corners[-1]))
vertices = [(p.x,y,p.y) for p in path for y in (-14,14)]
faces = [(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(path)-1)]
bracket = mesh_obj('Suporte_Chapa_Unica',vertices,faces)
mod = bracket.modifiers.new('Chapa_2mm','SOLIDIFY')
mod.thickness = 2
mod.offset = 0
mod.use_even_offset = True
apply(bracket,mod)
# Lateral guard drops below the sensing face (Z=0) before the guide foot.
# Rounded bends preserve a single sheet with 2 mm thickness.
foot_corners=[(12,16),(17,16),(17,-3),(24,-3)]
foot_path=[Vector(foot_corners[0])]
for i in range(1,len(foot_corners)-1):
    prev,cur,nxt=map(Vector,(foot_corners[i-1],foot_corners[i],foot_corners[i+1]))
    d=min(2.8,(prev-cur).length*.4,(nxt-cur).length*.4)
    a=cur+(prev-cur).normalized()*d
    b=cur+(nxt-cur).normalized()*d
    foot_path.append(a)
    for j in range(1,9):
        t=j/8
        foot_path.append((1-t)**2*a+2*(1-t)*t*cur+t*t*b)
foot_path.append(Vector(foot_corners[-1]))
for j in range(1,25):
    t=j/24
    foot_path.append((24+22*t,-3+12*t*t))
foot=mesh_obj('Pe_Lateral_Construcao',
    [(x,y,z) for y,z in foot_path for x in (-14.8,17)],
    [(2*i,2*i+2,2*i+3,2*i+1) for i in range(len(foot_path)-1)])
mod=foot.modifiers.new('Espessura','SOLIDIFY')
mod.thickness=2
mod.offset=0
mod.use_even_offset=True
apply(foot,mod)
mod=bracket.modifiers.new('Chapa_continua','BOOLEAN')
mod.operation='UNION'
mod.solver='EXACT'
mod.object=foot
apply(bracket,mod)
bpy.data.objects.remove(foot,do_unlink=True)
drill(bracket,9.3,8,(0,0,16))
for z in (54,65):
    drill(bracket,2.75,10,(-27,0,z),(0,math.pi/2,0))
bevel(bracket,.22)
bracket['espessura_mm']=2
bracket['largura_mm']=28
bracket['furo_sensor_mm']=18.6
bracket['furo_fixacao_mm']=5.5
bracket['nivel_base_pe_mm']=-3
bracket['nivel_face_sensora_mm']=0
bracket['nota']='Chapa unica com dobras; dimensoes estimadas das fotos.'

def nut(name, bottom):
    # 24 mm across flats, 4 mm thick, circular bore with no internal thread.
    n = 96
    vertices = []
    for z, inner in [(bottom,False),(bottom+4,False),(bottom,True),(bottom+4,True)]:
        for i in range(n):
            a = 2*math.pi*i/n
            r = 9.05 if inner else 12/math.cos((a+math.pi/6)%(math.pi/3)-math.pi/6)
            vertices.append((r*math.cos(a),r*math.sin(a),z))
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+j,2*n+i,3*n+i,3*n+j),
                      (n+i,n+j,3*n+j,3*n+i),(j,i,2*n+i,2*n+j)])
    obj=mesh_obj(name,vertices,faces)
    bevel(obj,.35)
    obj['rosca_nominal']='M18; furo interno simplificado'
    return obj

upper=nut('Porca_M18_Superior',17)
lower=nut('Porca_M18_Inferior',11)

def bolt(z,index):
    # One connected stepped solid per bolt: shank, bearing flange, hex head.
    n=48
    sections=[(-33,2.4,'round'),(-26,2.4,'round'),(-26,4.5,'round'),
              (-25.3,4.5,'round'),(-25.3,4,'hex'),(-22.5,4,'hex')]
    vertices=[]
    for x,r,shape in sections:
        for i in range(n):
            a=2*math.pi*i/n
            radius=r if shape=='round' else r/math.cos((a+math.pi/6)%(math.pi/3)-math.pi/6)
            vertices.append((x,radius*math.cos(a),z+radius*math.sin(a)))
    faces=[tuple(reversed(range(n))),tuple((len(sections)-1)*n+i for i in range(n))]
    for s in range(len(sections)-1):
        for i in range(n):
            j=(i+1)%n
            faces.append((s*n+i,s*n+j,(s+1)*n+j,(s+1)*n+i))
    obj=mesh_obj('Parafuso_Fixacao_%02d'%index,vertices,faces)
    bevel(obj,.12)
    obj['nota']='Parafuso M5 ilustrativo com flange; haste sem rosca.'
    return obj
bolts=[bolt(z,i+1) for i,z in enumerate((54,65))]
hardware_parts=[bracket,upper,lower]+bolts

# Validate a closed, connected bracket rather than separate intersecting plates.
for obj in hardware_parts:
    bm=bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    assert all(e.is_manifold for e in bm.edges), obj.name+' has open edges'
    visited=set()
    stack=[bm.verts[0]]
    while stack:
        v=stack.pop()
        if v in visited: continue
        visited.add(v)
        stack.extend(e.other_vert(v) for e in v.link_edges)
    assert len(visited)==len(bm.verts), obj.name+' is disconnected'
    bm.free()
    for v in obj.data.vertices: v.co *= .001

assembly=bpy.data.objects.new('Conjunto_Sensor_M18',None)
bpy.context.scene.collection.objects.link(assembly)
hardware=bpy.data.objects.new('Fixacao',None)
collection.objects.link(hardware)
hardware.parent=assembly
for obj in hardware_parts: obj.parent=hardware
sensor=bpy.data.objects['Sensor_Indutivo_M18']
sensor.parent=assembly
sensor['observacao']='Referencia didatica; dimensoes longitudinais e conector aproximados; sem cabo.'
def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name),export_format='GLB',use_selection=True,export_yup=True)
export('sensor_M18_com_suporte.glb',[assembly,sensor,hardware]+list(sensor.children)+list(hardware.children))
export('suporte_e_porcas.glb',[hardware]+list(hardware.children))
scene=bpy.context.scene
camera=scene.camera
camera.location=(.145,.2,.125)
target=Vector((-.003,.012,.035))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=.115
scene.render.resolution_x=1100
scene.render.resolution_y=1100
scene.render.filepath=os.path.join(OUT,'sensor_M18_com_suporte_preview.png')
bpy.ops.object.select_all(action='DESELECT')
bracket.select_set(True)
bpy.context.view_layer.objects.active=bracket
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'sensor_indutivo_M18.blend'))
bpy.ops.render.render(write_still=True)
camera.location=(.14,-.20,.10)
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=os.path.join(OUT,'suporte_angulo_oposto.png')
bpy.ops.render.render(write_still=True)
print('SUPORTE_OK: 5 closed connected meshes, lateral foot, 2 mounting bolts; exported in metres')
